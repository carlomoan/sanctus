
-- ============================================================================
-- ECCLESIABOOKS PARISH MANAGEMENT SYSTEM - POSTGRESQL DATABASE SCHEMA
-- ============================================================================
-- Version: 2.0
-- Database: PostgreSQL 14+
-- Purpose: Complete schema for Catholic Parish Management with offline-first sync
-- Features: UUID-based IDs, Soft Deletes, Audit Trails, Multi-tenancy
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- SECTION 1: DIOCESE & PARISH HIERARCHY
-- ============================================================================

-- Diocese (Top-level organization)
CREATE TABLE diocese (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    diocese_code VARCHAR(20) UNIQUE NOT NULL,
    diocese_name VARCHAR(200) NOT NULL,
    bishop_name VARCHAR(200),
    established_date DATE,
    headquarters_address TEXT,
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Tanzania',
    currency_code VARCHAR(3) DEFAULT 'TZS',
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Parish (Belongs to Diocese)
CREATE TABLE parish (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    diocese_id UUID NOT NULL REFERENCES diocese(id) ON DELETE RESTRICT,
    parish_code VARCHAR(20) UNIQUE NOT NULL,
    parish_name VARCHAR(200) NOT NULL,
    patron_saint VARCHAR(100),
    priest_name VARCHAR(200),
    established_date DATE,
    physical_address TEXT,
    postal_address TEXT,
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    bank_account_name VARCHAR(200),
    bank_account_number VARCHAR(50),
    bank_name VARCHAR(100),
    bank_branch VARCHAR(100),
    mobile_money_name VARCHAR(100), -- e.g., "M-Pesa"
    mobile_money_number VARCHAR(20),
    mobile_money_account_name VARCHAR(200),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    timezone VARCHAR(50) DEFAULT 'Africa/Dar_es_Salaam',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_coordinates CHECK (
        (latitude IS NULL AND longitude IS NULL) OR 
        (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
    )
);

-- Small Christian Communities (SCC) - Sub-parish groups
CREATE TABLE scc (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parish_id UUID NOT NULL REFERENCES parish(id) ON DELETE CASCADE,
    scc_code VARCHAR(20) NOT NULL,
    scc_name VARCHAR(200) NOT NULL,
    patron_saint VARCHAR(100),
    leader_name VARCHAR(200),
    location_description TEXT,
    meeting_day VARCHAR(20), -- e.g., "Wednesday"
    meeting_time TIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(parish_id, scc_code)
);

-- ============================================================================
-- SECTION 2: USER MANAGEMENT & AUTHENTICATION
-- ============================================================================

-- User Roles Enumeration
CREATE TYPE user_role AS ENUM (
    'SUPER_ADMIN',      -- Diocese level, full access
    'PARISH_ADMIN',     -- Parish Priest, approves everything
    'ACCOUNTANT',       -- Records income/expenses, generates reports
    'SECRETARY',        -- Manages members, issues certificates
    'VIEWER',           -- Read-only access (Bishop, Auditors)
    'SCC_LEADER'        -- Limited access to their SCC only
);

-- Application Users
CREATE TABLE app_user (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    diocese_id UUID REFERENCES diocese(id) ON DELETE RESTRICT,
    parish_id UUID REFERENCES parish(id) ON DELETE CASCADE,
    scc_id UUID REFERENCES scc(id) ON DELETE SET NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- BCrypt hash
    full_name VARCHAR(200) NOT NULL,
    phone_number VARCHAR(20),
    role user_role NOT NULL,
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip VARCHAR(45), -- Supports IPv6
    failed_login_attempts INT DEFAULT 0,
    account_locked_until TIMESTAMP WITH TIME ZONE,
    must_change_password BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_scope CHECK (
        (role = 'SUPER_ADMIN' AND diocese_id IS NOT NULL AND parish_id IS NULL) OR
        (role IN ('PARISH_ADMIN', 'ACCOUNTANT', 'SECRETARY') AND parish_id IS NOT NULL) OR
        (role = 'SCC_LEADER' AND scc_id IS NOT NULL) OR
        (role = 'VIEWER')
    )
);

-- Password Reset Tokens
CREATE TABLE password_reset_token (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Refresh Tokens for JWT Authentication
CREATE TABLE refresh_token (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    device_info VARCHAR(500),
    ip_address VARCHAR(45),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 3: MEMBER MANAGEMENT
-- ============================================================================

-- Family Units (Households)
CREATE TABLE family (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parish_id UUID NOT NULL REFERENCES parish(id) ON DELETE CASCADE,
    scc_id UUID REFERENCES scc(id) ON DELETE SET NULL,
    family_code VARCHAR(20) NOT NULL, -- e.g., "FAM-2026-001"
    family_name VARCHAR(200) NOT NULL,
    head_of_family_id UUID, -- Self-reference, set after creating members
    physical_address TEXT,
    postal_address TEXT,
    primary_phone VARCHAR(20),
    secondary_phone VARCHAR(20),
    email VARCHAR(100),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(parish_id, family_code)
);

-- Gender Enumeration
CREATE TYPE gender_type AS ENUM ('MALE', 'FEMALE');

-- Marital Status Enumeration
CREATE TYPE marital_status AS ENUM (
    'SINGLE',
    'MARRIED',
    'WIDOWED',
    'SEPARATED',
    'DIVORCED'
);

-- Members (Individual parishioners)
CREATE TABLE member (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parish_id UUID NOT NULL REFERENCES parish(id) ON DELETE CASCADE,
    family_id UUID REFERENCES family(id) ON DELETE SET NULL,
    scc_id UUID REFERENCES scc(id) ON DELETE SET NULL,
    member_code VARCHAR(20) NOT NULL, -- e.g., "MEM-2026-001234"
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender gender_type,
    marital_status marital_status,
    national_id VARCHAR(50),
    occupation VARCHAR(100),
    email VARCHAR(100),
    phone_number VARCHAR(20),
    physical_address TEXT,
    photo_url TEXT,
    is_head_of_family BOOLEAN DEFAULT FALSE,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(parish_id, member_code),
    CONSTRAINT valid_dob CHECK (date_of_birth <= CURRENT_DATE)
);

-- Now add foreign key to family table
ALTER TABLE family 
ADD CONSTRAINT fk_family_head 
FOREIGN KEY (head_of_family_id) 
REFERENCES member(id) ON DELETE SET NULL;

-- Sacrament Types Enumeration
CREATE TYPE sacrament_type AS ENUM (
    'BAPTISM',
    'FIRST_COMMUNION',
    'CONFIRMATION',
    'MARRIAGE',
    'HOLY_ORDERS',
    'ANOINTING_OF_SICK'
);

-- Sacramental Records
CREATE TABLE sacrament_record (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES member(id) ON DELETE CASCADE,
    sacrament_type sacrament_type NOT NULL,
    sacrament_date DATE NOT NULL,
    officiating_minister VARCHAR(200),
    parish_id UUID NOT NULL REFERENCES parish(id) ON DELETE CASCADE,
    church_name VARCHAR(200),
    certificate_number VARCHAR(50),
    godparent_1_name VARCHAR(200),
    godparent_2_name VARCHAR(200),
    spouse_id UUID REFERENCES member(id) ON DELETE SET NULL, -- For Marriage
    spouse_name VARCHAR(200), -- If spouse not in system
    witnesses TEXT, -- For Marriage
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(member_id, sacrament_type)
);

-- ============================================================================
-- SECTION 4: FINANCIAL MANAGEMENT
-- ============================================================================

-- Transaction Categories
CREATE TYPE transaction_category AS ENUM (
    'TITHE',
    'OFFERTORY',
    'THANKSGIVING',
    'DONATION',
    'FUNDRAISING',
    'MASS_OFFERING',
    'WEDDING_FEE',
    'BAPTISM_FEE',
    'FUNERAL_FEE',
    'CERTIFICATE_FEE',
    'RENT_INCOME',
    'INVESTMENT_INCOME',
    'OTHER_INCOME',
    'SALARY_EXPENSE',
    'UTILITIES_EXPENSE',
    'MAINTENANCE_EXPENSE',
    'SUPPLIES_EXPENSE',
    'DIOCESAN_LEVY',
    'CHARITY_EXPENSE',
    'CONSTRUCTION_EXPENSE',
    'OTHER_EXPENSE'
);

-- Payment Methods
CREATE TYPE payment_method AS ENUM (
    'CASH',
    'CHEQUE',
    'BANK_TRANSFER',
    'MPESA',
    'TIGO_PESA',
    'AIRTEL_MONEY',
    'HALOPESA',
    'CREDIT_CARD',
    'OTHER'
);

-- Income Transactions
CREATE TABLE income_transaction (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parish_id UUID NOT NULL REFERENCES parish(id) ON DELETE CASCADE,
    member_id UUID REFERENCES member(id) ON DELETE SET NULL,
    transaction_number VARCHAR(50) UNIQUE NOT NULL, -- e.g., "INC-2026-001234"
    category transaction_category NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    payment_method payment_method NOT NULL,
    transaction_date DATE NOT NULL,
    transaction_time TIME DEFAULT CURRENT_TIME,
    description TEXT,
    reference_number VARCHAR(100), -- Bank ref, M-Pesa code, etc.
    received_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    receipt_printed BOOLEAN DEFAULT FALSE,
    receipt_printed_at TIMESTAMP WITH TIME ZONE,
    is_synced BOOLEAN DEFAULT FALSE,
    synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT positive_amount CHECK (amount > 0)
);

-- Expense Approval Status
CREATE TYPE approval_status AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
);

-- Expense Vouchers
CREATE TABLE expense_voucher (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parish_id UUID NOT NULL REFERENCES parish(id) ON DELETE CASCADE,
    voucher_number VARCHAR(50) UNIQUE NOT NULL, -- e.g., "VOU-2026-001234"
    category transaction_category NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    payment_method payment_method NOT NULL,
    payee_name VARCHAR(200) NOT NULL,
    payee_phone VARCHAR(20),
    expense_date DATE NOT NULL,
    description TEXT NOT NULL,
    reference_number VARCHAR(100),
    approval_status approval_status DEFAULT 'PENDING',
    requested_by UUID NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
    approved_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMP WITH TIME ZONE,
    is_synced BOOLEAN DEFAULT FALSE,
    synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT positive_voucher_amount CHECK (amount > 0),
    CONSTRAINT approved_needs_approver CHECK (
        (approval_status = 'APPROVED' AND approved_by IS NOT NULL) OR
        approval_status != 'APPROVED'
    )
);

-- Attachments for Vouchers (Receipts, Invoices)
CREATE TABLE voucher_attachment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_id UUID NOT NULL REFERENCES expense_voucher(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50), -- e.g., "image/jpeg", "application/pdf"
    file_size_bytes BIGINT,
    uploaded_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bank Reconciliation
CREATE TABLE bank_reconciliation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parish_id UUID NOT NULL REFERENCES parish(id) ON DELETE CASCADE,
    reconciliation_date DATE NOT NULL,
    bank_statement_balance DECIMAL(15, 2) NOT NULL,
    book_balance DECIMAL(15, 2) NOT NULL,
    difference DECIMAL(15, 2) GENERATED ALWAYS AS (bank_statement_balance - book_balance) STORED,
    reconciled_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 5: THIRD-PARTY API INTEGRATIONS
-- ============================================================================

-- API Integration Types
CREATE TYPE integration_type AS ENUM (
    'MOBILE_MONEY',
    'BANK_API',
    'SMS_GATEWAY',
    'EMAIL_SERVICE',
    'ACCOUNTING_SOFTWARE',
    'OTHER'
);

-- Integration Configurations
CREATE TABLE api_integration (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parish_id UUID REFERENCES parish(id) ON DELETE CASCADE,
    diocese_id UUID REFERENCES diocese(id) ON DELETE CASCADE,
    integration_type integration_type NOT NULL,
    provider_name VARCHAR(100) NOT NULL, -- e.g., "M-Pesa", "CRDB Bank"
    api_key_encrypted TEXT, -- Encrypted with pgcrypto
    api_secret_encrypted TEXT,
    webhook_url TEXT,
    callback_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    configuration_json JSONB, -- Additional settings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT scope_check CHECK (
        (parish_id IS NOT NULL AND diocese_id IS NULL) OR
        (parish_id IS NULL AND diocese_id IS NOT NULL)
    )
);

-- Mobile Money Transaction Log
CREATE TABLE mobile_money_transaction (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID NOT NULL REFERENCES api_integration(id) ON DELETE CASCADE,
    income_transaction_id UUID REFERENCES income_transaction(id) ON DELETE SET NULL,
    external_transaction_id VARCHAR(100) UNIQUE NOT NULL, -- M-Pesa receipt number
    sender_phone VARCHAR(20) NOT NULL,
    sender_name VARCHAR(200),
    amount DECIMAL(15, 2) NOT NULL,
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    matched_to_member_id UUID REFERENCES member(id) ON DELETE SET NULL,
    raw_callback_data JSONB,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SMS Log
CREATE TABLE sms_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID NOT NULL REFERENCES api_integration(id) ON DELETE CASCADE,
    recipient_phone VARCHAR(20) NOT NULL,
    message_text TEXT NOT NULL,
    message_type VARCHAR(50), -- e.g., "RECEIPT", "REMINDER", "ANNOUNCEMENT"
    member_id UUID REFERENCES member(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    external_message_id VARCHAR(100),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    failed_reason TEXT,
    cost_amount DECIMAL(10, 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email Log
CREATE TABLE email_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_email VARCHAR(100) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body_text TEXT,
    body_html TEXT,
    email_type VARCHAR(50), -- e.g., "REPORT", "RECEIPT", "NEWSLETTER"
    member_id UUID REFERENCES member(id) ON DELETE SET NULL,
    user_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    sent_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    failed_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 6: OFFLINE SYNC MANAGEMENT
-- ============================================================================

-- Sync Queue (Tracks offline changes waiting to sync)
CREATE TABLE sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(100) NOT NULL, -- Unique device identifier
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    data_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMP WITH TIME ZONE,
    sync_attempts INT DEFAULT 0,
    last_sync_error TEXT
);

-- Sync Conflict Log
CREATE TABLE sync_conflict (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    local_data JSONB NOT NULL,
    server_data JSONB NOT NULL,
    local_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    server_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    resolution VARCHAR(50) DEFAULT 'PENDING', -- PENDING, LOCAL_WINS, SERVER_WINS, MANUAL
    resolved_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 7: AUDIT & LOGGING
-- ============================================================================

-- Audit Log (Tracks all critical actions)
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
    parish_id UUID REFERENCES parish(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL, -- e.g., "LOGIN", "APPROVE_VOUCHER", "DELETE_MEMBER"
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);
CREATE INDEX idx_audit_log_action ON audit_log(action_type);

-- System Settings (Key-Value Store)
CREATE TABLE system_setting (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parish_id UUID REFERENCES parish(id) ON DELETE CASCADE,
    diocese_id UUID REFERENCES diocese(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    data_type VARCHAR(20) DEFAULT 'STRING', -- STRING, INTEGER, BOOLEAN, JSON
    description TEXT,
    updated_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(parish_id, diocese_id, setting_key)
);

-- ============================================================================
-- SECTION 8: PERFORMANCE INDEXES
-- ============================================================================

-- Diocese & Parish
CREATE INDEX idx_parish_diocese ON parish(diocese_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_scc_parish ON scc(parish_id) WHERE deleted_at IS NULL;

-- Users
CREATE INDEX idx_user_parish ON app_user(parish_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_email ON app_user(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_role ON app_user(role);

-- Members
CREATE INDEX idx_member_parish ON member(parish_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_member_family ON member(family_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_member_code ON member(member_code);
CREATE INDEX idx_member_name ON member(last_name, first_name);
CREATE INDEX idx_member_phone ON member(phone_number);

-- Family
CREATE INDEX idx_family_parish ON family(parish_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_family_scc ON family(scc_id) WHERE deleted_at IS NULL;

-- Sacraments
CREATE INDEX idx_sacrament_member ON sacrament_record(member_id);
CREATE INDEX idx_sacrament_type ON sacrament_record(sacrament_type);
CREATE INDEX idx_sacrament_date ON sacrament_record(sacrament_date);

-- Financial Transactions
CREATE INDEX idx_income_parish ON income_transaction(parish_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_income_member ON income_transaction(member_id);
CREATE INDEX idx_income_date ON income_transaction(transaction_date DESC);
CREATE INDEX idx_income_category ON income_transaction(category);
CREATE INDEX idx_income_sync ON income_transaction(is_synced) WHERE is_synced = FALSE;

CREATE INDEX idx_voucher_parish ON expense_voucher(parish_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_voucher_status ON expense_voucher(approval_status);
CREATE INDEX idx_voucher_date ON expense_voucher(expense_date DESC);
CREATE INDEX idx_voucher_sync ON expense_voucher(is_synced) WHERE is_synced = FALSE;

-- API Integrations
CREATE INDEX idx_mobile_money_phone ON mobile_money_transaction(sender_phone);
CREATE INDEX idx_mobile_money_processed ON mobile_money_transaction(processed) WHERE processed = FALSE;
CREATE INDEX idx_sms_status ON sms_log(status) WHERE status = 'PENDING';

-- Sync Management
CREATE INDEX idx_sync_queue_device ON sync_queue(device_id, synced_at);
CREATE INDEX idx_sync_queue_unsynced ON sync_queue(synced_at) WHERE synced_at IS NULL;

-- ============================================================================
-- SECTION 9: VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Active Members with Family Info
CREATE VIEW v_active_members AS
SELECT 
    m.id,
    m.member_code,
    m.first_name || ' ' || m.last_name AS full_name,
    m.phone_number,
    m.email,
    m.date_of_birth,
    m.gender,
    m.marital_status,
    f.family_name,
    f.family_code,
    s.scc_name,
    p.parish_name,
    m.is_head_of_family,
    m.created_at
FROM member m
LEFT JOIN family f ON m.family_id = f.id
LEFT JOIN scc s ON m.scc_id = s.id
JOIN parish p ON m.parish_id = p.id
WHERE m.deleted_at IS NULL AND m.is_active = TRUE;

-- Financial Summary by Parish
CREATE VIEW v_parish_financial_summary AS
SELECT 
    p.id AS parish_id,
    p.parish_name,
    COALESCE(SUM(CASE WHEN it.deleted_at IS NULL THEN it.amount ELSE 0 END), 0) AS total_income,
    COALESCE(SUM(CASE WHEN ev.deleted_at IS NULL AND ev.approval_status = 'APPROVED' AND ev.paid THEN ev.amount ELSE 0 END), 0) AS total_expenses,
    COALESCE(SUM(CASE WHEN it.deleted_at IS NULL THEN it.amount ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN ev.deleted_at IS NULL AND ev.approval_status = 'APPROVED' AND ev.paid THEN ev.amount ELSE 0 END), 0) AS net_balance
FROM parish p
LEFT JOIN income_transaction it ON p.id = it.parish_id
LEFT JOIN expense_voucher ev ON p.id = ev.parish_id
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.parish_name;

-- Pending Approvals
CREATE VIEW v_pending_approvals AS
SELECT 
    ev.id,
    ev.voucher_number,
    ev.amount,
    ev.payee_name,
    ev.description,
    ev.expense_date,
    p.parish_name,
    u.full_name AS requested_by_name,
    ev.created_at
FROM expense_voucher ev
JOIN parish p ON ev.parish_id = p.id
JOIN app_user u ON ev.requested_by = u.id
WHERE ev.approval_status = 'PENDING' 
  AND ev.deleted_at IS NULL
ORDER BY ev.created_at ASC;

-- Member Sacrament Status
CREATE VIEW v_member_sacraments AS
SELECT 
    m.id AS member_id,
    m.member_code,
    m.first_name || ' ' || m.last_name AS full_name,
    MAX(CASE WHEN sr.sacrament_type = 'BAPTISM' THEN sr.sacrament_date END) AS baptism_date,
    MAX(CASE WHEN sr.sacrament_type = 'FIRST_COMMUNION' THEN sr.sacrament_date END) AS communion_date,
    MAX(CASE WHEN sr.sacrament_type = 'CONFIRMATION' THEN sr.sacrament_date END) AS confirmation_date,
    MAX(CASE WHEN sr.sacrament_type = 'MARRIAGE' THEN sr.sacrament_date END) AS marriage_date,
    MAX(CASE WHEN sr.sacrament_type = 'HOLY_ORDERS' THEN sr.sacrament_date END) AS ordination_date
FROM member m
LEFT JOIN sacrament_record sr ON m.id = sr.member_id AND sr.deleted_at IS NULL
WHERE m.deleted_at IS NULL
GROUP BY m.id, m.member_code, m.first_name, m.last_name;

-- ============================================================================
-- SECTION 10: FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function: Update timestamp on row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER set_diocese_updated_at BEFORE UPDATE ON diocese 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_parish_updated_at BEFORE UPDATE ON parish 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_scc_updated_at BEFORE UPDATE ON scc 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_user_updated_at BEFORE UPDATE ON app_user 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_family_updated_at BEFORE UPDATE ON family 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_member_updated_at BEFORE UPDATE ON member 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_sacrament_updated_at BEFORE UPDATE ON sacrament_record 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_income_updated_at BEFORE UPDATE ON income_transaction 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_voucher_updated_at BEFORE UPDATE ON expense_voucher 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Audit trigger for critical tables
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log(table_name, record_id, action_type, old_values)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD));
        RETURN OLD;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log(table_name, record_id, action_type, new_values)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log(table_name, record_id, action_type, old_values, new_values)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to financial tables
CREATE TRIGGER audit_income_transaction 
    AFTER INSERT OR UPDATE OR DELETE ON income_transaction
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_expense_voucher 
    AFTER INSERT OR UPDATE OR DELETE ON expense_voucher
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Function: Generate sequential transaction numbers
CREATE SEQUENCE income_transaction_seq START 1;
CREATE SEQUENCE expense_voucher_seq START 1;

CREATE OR REPLACE FUNCTION generate_transaction_number()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'income_transaction' THEN
        NEW.transaction_number := 'INC-' || 
            TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || 
            LPAD(nextval('income_transaction_seq')::TEXT, 6, '0');
    ELSIF TG_TABLE_NAME = 'expense_voucher' THEN
        NEW.voucher_number := 'VOU-' || 
            TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || 
            LPAD(nextval('expense_voucher_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_income_number 
    BEFORE INSERT ON income_transaction
    FOR EACH ROW 
    WHEN (NEW.transaction_number IS NULL)
    EXECUTE FUNCTION generate_transaction_number();

CREATE TRIGGER generate_voucher_number 
    BEFORE INSERT ON expense_voucher
    FOR EACH ROW 
    WHEN (NEW.voucher_number IS NULL)
    EXECUTE FUNCTION generate_transaction_number();

-- Function: Validate voucher approval
CREATE OR REPLACE FUNCTION validate_voucher_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.approval_status = 'APPROVED' THEN
        IF NEW.approved_by IS NULL THEN
            RAISE EXCEPTION 'approved_by cannot be NULL when status is APPROVED';
        END IF;
        IF NEW.approved_at IS NULL THEN
            NEW.approved_at := CURRENT_TIMESTAMP;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_voucher_approval_trigger
    BEFORE UPDATE ON expense_voucher
    FOR EACH ROW
    EXECUTE FUNCTION validate_voucher_approval();

-- ============================================================================
-- SECTION 11: SECURITY - ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on sensitive tables
ALTER TABLE income_transaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_voucher ENABLE ROW LEVEL SECURITY;
ALTER TABLE member ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see data from their parish
CREATE POLICY parish_isolation_income ON income_transaction
    FOR ALL
    USING (
        parish_id IN (
            SELECT parish_id FROM app_user WHERE id = current_setting('app.current_user_id')::UUID
        )
        OR
        EXISTS (
            SELECT 1 FROM app_user WHERE id = current_setting('app.current_user_id')::UUID AND role = 'SUPER_ADMIN'
        )
    );

CREATE POLICY parish_isolation_voucher ON expense_voucher
    FOR ALL
    USING (
        parish_id IN (
            SELECT parish_id FROM app_user WHERE id = current_setting('app.current_user_id')::UUID
        )
        OR
        EXISTS (
            SELECT 1 FROM app_user WHERE id = current_setting('app.current_user_id')::UUID AND role = 'SUPER_ADMIN'
        )
    );

CREATE POLICY parish_isolation_member ON member
    FOR ALL
    USING (
        parish_id IN (
            SELECT parish_id FROM app_user WHERE id = current_setting('app.current_user_id')::UUID
        )
        OR
        EXISTS (
            SELECT 1 FROM app_user WHERE id = current_setting('app.current_user_id')::UUID AND role = 'SUPER_ADMIN'
        )
    );

-- ============================================================================
-- SECTION 12: SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert Sample Diocese
INSERT INTO diocese (diocese_code, diocese_name, bishop_name, headquarters_address, country)
VALUES ('DOM-001', 'Diocese of Morogoro', 'Bishop Lazarus Msimbe', 'P.O. Box 12, Morogoro', 'Tanzania');

-- Insert Sample Parish
INSERT INTO parish (
    diocese_id, 
    parish_code, 
    parish_name, 
    patron_saint, 
    priest_name,
    contact_phone,
    bank_account_number,
    bank_name,
    mobile_money_number,
    mobile_money_name
)
SELECT 
    d.id,
    'PAR-001',
    'St. Patric''s Parish',
    'Saint Patric',
    'Fr. Joseph Mwamba',
    '+255712345678',
    '0123456789',
    'CRDB Bank',
    '0712345678',
    'M-Pesa'
FROM diocese d WHERE diocese_code = 'DOM-001';

-- Insert Sample SCC
INSERT INTO scc (parish_id, scc_code, scc_name, patron_saint, leader_name)
SELECT 
    p.id,
    'SCC-001',
    'St. Peter Community',
    'St. Peter',
    'John Mapunda'
FROM parish p WHERE parish_code = 'PAR-001';

-- Insert Sample Admin User (Password: Admin@123 - BCrypt hash)
INSERT INTO app_user (
    parish_id,
    username,
    email,
    password_hash,
    full_name,
    phone_number,
    role
)
SELECT 
    p.id,
    'admin',
    'admin@stmarys.org',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- Admin@123
    'Parish Administrator',
    '+255712345678',
    'PARISH_ADMIN'
FROM parish p WHERE parish_code = 'PAR-001';

-- Insert Sample Family
INSERT INTO family (parish_id, scc_id, family_code, family_name, primary_phone)
SELECT 
    p.id,
    s.id,
    'FAM-2026-001',
    'Mwamba Family',
    '+255712345678'
FROM parish p
JOIN scc s ON p.id = s.parish_id
WHERE p.parish_code = 'PAR-001' AND s.scc_code = 'SCC-001';

-- Insert Sample Member
INSERT INTO member (
    parish_id,
    family_id,
    scc_id,
    member_code,
    first_name,
    last_name,
    date_of_birth,
    gender,
    marital_status,
    phone_number,
    is_head_of_family
)
SELECT 
    f.parish_id,
    f.id,
    f.scc_id,
    'MEM-2026-001',
    'John',
    'Mwamba',
    '1980-05-15',
    'MALE',
    'MARRIED',
    '+255712345678',
    TRUE
FROM family f WHERE f.family_code = 'FAM-2026-001';

-- Insert Sample Income Transaction
INSERT INTO income_transaction (
    parish_id,
    member_id,
    category,
    amount,
    payment_method,
    transaction_date,
    description,
    received_by
)
SELECT 
    p.id,
    m.id,
    'TITHE',
    50000.00,
    'MPESA',
    CURRENT_DATE,
    'Sunday tithe offering',
    u.id
FROM parish p
JOIN member m ON p.id = m.parish_id
JOIN app_user u ON p.id = u.parish_id
WHERE p.parish_code = 'PAR-001' 
  AND m.member_code = 'MEM-2026-001'
  AND u.role = 'PARISH_ADMIN';

-- ============================================================================
-- SECTION 13: MAINTENANCE PROCEDURES
-- ============================================================================

-- Function: Soft delete expired refresh tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM refresh_token WHERE expires_at < CURRENT_TIMESTAMP;
    DELETE FROM password_reset_token WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function: Archive old audit logs (older than 2 years)
CREATE TABLE audit_log_archive (LIKE audit_log INCLUDING ALL);

CREATE OR REPLACE FUNCTION archive_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    WITH moved_rows AS (
        DELETE FROM audit_log 
        WHERE created_at < CURRENT_DATE - INTERVAL '2 years'
        RETURNING *
    )
    INSERT INTO audit_log_archive SELECT * FROM moved_rows;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Generate financial report data
CREATE OR REPLACE FUNCTION get_financial_summary(
    p_parish_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    total_income DECIMAL(15,2),
    total_expenses DECIMAL(15,2),
    net_balance DECIMAL(15,2),
    transaction_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(it.amount), 0) AS total_income,
        COALESCE(SUM(CASE WHEN ev.approval_status = 'APPROVED' AND ev.paid THEN ev.amount ELSE 0 END), 0) AS total_expenses,
        COALESCE(SUM(it.amount), 0) - COALESCE(SUM(CASE WHEN ev.approval_status = 'APPROVED' AND ev.paid THEN ev.amount ELSE 0 END), 0) AS net_balance,
        COUNT(DISTINCT it.id)::INTEGER AS transaction_count
    FROM parish p
    LEFT JOIN income_transaction it ON p.id = it.parish_id 
        AND it.transaction_date BETWEEN p_start_date AND p_end_date
        AND it.deleted_at IS NULL
    LEFT JOIN expense_voucher ev ON p.id = ev.parish_id 
        AND ev.expense_date BETWEEN p_start_date AND p_end_date
        AND ev.deleted_at IS NULL
    WHERE p.id = p_parish_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 14: BACKUP RECOMMENDATIONS
-- ============================================================================

-- Create backup schema
CREATE SCHEMA IF NOT EXISTS backup;

-- Comments for documentation
COMMENT ON DATABASE sanctus IS 'Sanctus Parish Management System - Production Database';
COMMENT ON TABLE income_transaction IS 'Stores all income transactions with offline-sync support';
COMMENT ON TABLE expense_voucher IS 'Expense vouchers requiring approval workflow';
COMMENT ON TABLE member IS 'Parish member registry with family relationships';
COMMENT ON COLUMN member.member_code IS 'Unique identifier format: MEM-YYYY-NNNNNN';
COMMENT ON TABLE mobile_money_transaction IS 'Logs all mobile money API callbacks for reconciliation';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================


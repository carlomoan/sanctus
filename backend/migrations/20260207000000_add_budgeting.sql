-- Budgeting Table
CREATE TABLE budget (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parish_id UUID NOT NULL REFERENCES parish(id) ON DELETE CASCADE,
    category transaction_category NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    fiscal_year INT NOT NULL,
    fiscal_month INT, -- NULL means annual budget for that category
    description TEXT,
    created_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(parish_id, category, fiscal_year, fiscal_month)
);

CREATE INDEX idx_budget_parish ON budget(parish_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_budget_year ON budget(fiscal_year);

-- Add fiscal year/month columns to transactions for easier reporting if needed, 
-- but we can derive them from transaction_date.

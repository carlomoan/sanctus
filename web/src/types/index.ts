export type UUID = string;
export type ISODateString = string; // YYYY-MM-DD
export type ISODateTimeString = string; // ISO 8601

// Enums
export enum GenderType {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

export enum MaritalStatus {
  SINGLE = "SINGLE",
  MARRIED = "MARRIED",
  WIDOWED = "WIDOWED",
  SEPARATED = "SEPARATED",
  DIVORCED = "DIVORCED",
}

export enum SacramentType {
  BAPTISM = "BAPTISM",
  FIRST_COMMUNION = "FIRST_COMMUNION",
  CONFIRMATION = "CONFIRMATION",
  MARRIAGE = "MARRIAGE",
  HOLY_ORDERS = "HOLY_ORDERS",
  ANOINTING_OF_SICK = "ANOINTING_OF_SICK",
}

export enum TransactionCategory {
  TITHE = "TITHE",
  OFFERTORY = "OFFERTORY",
  THANKSGIVING = "THANKSGIVING",
  DONATION = "DONATION",
  FUNDRAISING = "FUNDRAISING",
  MASS_OFFERING = "MASS_OFFERING",
  WEDDING_FEE = "WEDDING_FEE",
  BAPTISM_FEE = "BAPTISM_FEE",
  FUNERAL_FEE = "FUNERAL_FEE",
  CERTIFICATE_FEE = "CERTIFICATE_FEE",
  RENT_INCOME = "RENT_INCOME",
  INVESTMENT_INCOME = "INVESTMENT_INCOME",
  OTHER_INCOME = "OTHER_INCOME",
  SALARY_EXPENSE = "SALARY_EXPENSE",
  UTILITIES_EXPENSE = "UTILITIES_EXPENSE",
  MAINTENANCE_EXPENSE = "MAINTENANCE_EXPENSE",
  SUPPLIES_EXPENSE = "SUPPLIES_EXPENSE",
  DIOCESAN_LEVY = "DIOCESAN_LEVY",
  CHARITY_EXPENSE = "CHARITY_EXPENSE",
  CONSTRUCTION_EXPENSE = "CONSTRUCTION_EXPENSE",
  OTHER_EXPENSE = "OTHER_EXPENSE",
}

export enum PaymentMethod {
  CASH = "CASH",
  CHEQUE = "CHEQUE",
  BANK_TRANSFER = "BANK_TRANSFER",
  MPESA = "MPESA",
  TIGO_PESA = "TIGO_PESA",
  AIRTEL_MONEY = "AIRTEL_MONEY",
  HALOPESA = "HALOPESA",
  CREDIT_CARD = "CREDIT_CARD",
  OTHER = "OTHER",
}

export enum ApprovalStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

// Models

export interface Parish {
  id: UUID;
  diocese_id: UUID;
  parish_code: string;
  parish_name: string;
  patron_saint?: string;
  priest_name?: string;
  established_date?: ISODateString;
  physical_address?: string;
  postal_address?: string;
  contact_email?: string;
  contact_phone?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_name?: string;
  bank_branch?: string;
  mobile_money_name?: string;
  mobile_money_number?: string;
  mobile_money_account_name?: string;
  latitude?: number; // Decimal in Rust, number in TS
  longitude?: number;
  timezone?: string;
  is_active?: boolean;
  created_at?: ISODateTimeString;
  updated_at?: ISODateTimeString;
  deleted_at?: ISODateTimeString;
}

export interface Member {
  id: UUID;
  parish_id: UUID;
  family_id?: UUID;
  scc_id?: UUID;
  member_code: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth?: ISODateString;
  gender?: GenderType;
  marital_status?: MaritalStatus;
  national_id?: string;
  occupation?: string;
  email?: string;
  phone_number?: string;
  physical_address?: string;
  photo_url?: string;
  is_head_of_family?: boolean;
  notes?: string;
  is_active?: boolean;
  created_at?: ISODateTimeString;
  updated_at?: ISODateTimeString;
  deleted_at?: ISODateTimeString;
}

export interface SacramentRecord {
  id: UUID;
  member_id: UUID;
  sacrament_type: SacramentType;
  sacrament_date: ISODateString;
  officiating_minister?: string;
  parish_id: UUID;
  church_name?: string;
  certificate_number?: string;
  godparent_1_name?: string;
  godparent_2_name?: string;
  spouse_id?: UUID;
  spouse_name?: string;
  witnesses?: string;
  notes?: string;
  created_at?: ISODateTimeString;
  updated_at?: ISODateTimeString;
  deleted_at?: ISODateTimeString;
}

export interface IncomeTransaction {
  id: UUID;
  parish_id: UUID;
  member_id?: UUID;
  transaction_number: string;
  category: TransactionCategory;
  amount: number; // Decimal in Rust, number in TS
  payment_method: PaymentMethod;
  transaction_date: ISODateString;
  transaction_time?: string; // Time string
  description?: string;
  reference_number?: string;
  received_by?: UUID;
  receipt_printed?: boolean;
  receipt_printed_at?: ISODateTimeString;
  is_synced?: boolean;
  synced_at?: ISODateTimeString;
  created_at?: ISODateTimeString;
  updated_at?: ISODateTimeString;
  deleted_at?: ISODateTimeString;
}

export interface ExpenseVoucher {
  id: UUID;
  parish_id: UUID;
  voucher_number: string;
  category: TransactionCategory;
  amount: number;
  payment_method: PaymentMethod;
  payee_name: string;
  payee_phone?: string;
  expense_date: ISODateString;
  description: string;
  reference_number?: string;
  approval_status?: ApprovalStatus;
  requested_by: UUID;
  approved_by?: UUID;
  approved_at?: ISODateTimeString;
  rejection_reason?: string;
  paid?: boolean;
  paid_at?: ISODateTimeString;
  is_synced?: boolean;
  synced_at?: ISODateTimeString;
  created_at?: ISODateTimeString;
  updated_at?: ISODateTimeString;
  deleted_at?: ISODateTimeString;
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  PARISH_ADMIN = 'PARISH_ADMIN',
  ACCOUNTANT = 'ACCOUNTANT',
  SECRETARY = 'SECRETARY',
  VIEWER = 'VIEWER',
}

export interface User {
  id: UUID;
  parish_id?: UUID;
  username: string;
  email: string;
  full_name: string;
  phone_number?: string;
  role: UserRole;
  is_active: boolean;
  created_at: ISODateTimeString;
}

export interface Budget {
  id: UUID;
  parish_id: UUID;
  category: TransactionCategory;
  amount: number;
  fiscal_year: number;
  fiscal_month?: number;
  description?: string;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
}

export interface CreateBudgetRequest {
  parish_id: UUID;
  category: TransactionCategory;
  amount: number;
  fiscal_year: number;
  fiscal_month?: number;
  description?: string;
}

export interface UpdateBudgetRequest {
  amount?: number;
  description?: string;
}

export interface TrialBalanceEntry {
  category: string;
  debit: number;
  credit: number;
}

export interface TrialBalance {
  entries: TrialBalanceEntry[];
  total_debit: number;
  total_credit: number;
}

export interface ReportEntry {
  category: string;
  amount: number;
}

export interface IncomeExpenditureStatement {
  income_entries: ReportEntry[];
  expenditure_entries: ReportEntry[];
  total_income: number;
  total_expenditure: number;
  net_surplus_deficit: number;
}

// Auth

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  username_or_email: string;
  password: string;
}

// Request DTOs

export interface DashboardStats {
  total_members: number;
  active_parishes: number;
  total_income: number;
  total_expenses: number;
  pending_approvals: number;
}

export interface CreateParishRequest {
  diocese_id: UUID;
  parish_code: string;
  parish_name: string;
  patron_saint?: string;
  priest_name?: string;
  established_date?: ISODateString;
  physical_address?: string;
  contact_email?: string;
  contact_phone?: string;
}

export interface UpdateParishRequest {
  parish_name?: string;
  patron_saint?: string;
  priest_name?: string;
  physical_address?: string;
  contact_email?: string;
  contact_phone?: string;
  is_active?: boolean;
}

export interface CreateMemberRequest {
  parish_id: UUID;
  family_id?: UUID;
  scc_id?: UUID;
  member_code: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth?: ISODateString;
  gender?: GenderType;
  marital_status?: MaritalStatus;
  national_id?: string;
  occupation?: string;
  email?: string;
  phone_number?: string;
  physical_address?: string;
  photo_url?: string;
  is_head_of_family?: boolean;
  notes?: string;
}

export interface UpdateMemberRequest {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  date_of_birth?: ISODateString;
  gender?: GenderType;
  marital_status?: MaritalStatus;
  national_id?: string;
  occupation?: string;
  email?: string;
  phone_number?: string;
  physical_address?: string;
  photo_url?: string;
  is_head_of_family?: boolean;
  notes?: string;
  is_active?: boolean;
}

export interface CreateSacramentRequest {
  member_id: UUID;
  sacrament_type: SacramentType;
  sacrament_date: ISODateString;
  officiating_minister?: string;
  parish_id: UUID;
  church_name?: string;
  certificate_number?: string;
  godparent_1_name?: string;
  godparent_2_name?: string;
  spouse_id?: UUID;
  spouse_name?: string;
  witnesses?: string;
  notes?: string;
}

export interface UpdateSacramentRequest {
  sacrament_date?: ISODateString;
  officiating_minister?: string;
  church_name?: string;
  certificate_number?: string;
  godparent_1_name?: string;
  godparent_2_name?: string;
  spouse_id?: UUID;
  spouse_name?: string;
  witnesses?: string;
  notes?: string;
}

export interface CreateIncomeRequest {
  parish_id: UUID;
  member_id?: UUID;
  category: TransactionCategory;
  amount: number;
  payment_method: PaymentMethod;
  transaction_date: ISODateString;
  description?: string;
  reference_number?: string;
  received_by?: UUID;
}

export interface CreateExpenseRequest {
  parish_id: UUID;
  category: TransactionCategory;
  amount: number;
  payment_method: PaymentMethod;
  payee_name: string;
  payee_phone?: string;
  expense_date: ISODateString;
  description: string;
  reference_number?: string;
  requested_by: UUID;
}

export interface ImportResponse {
  success_count: number;
  errors: string[];
}

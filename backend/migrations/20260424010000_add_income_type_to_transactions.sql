-- Add income_type column to income_transaction table
-- Create the income_type enum type
DO $$ BEGIN
    CREATE TYPE income_type AS ENUM ('INDIVIDUAL', 'GROUP');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add the income_type column to income_transaction table
ALTER TABLE income_transaction 
ADD COLUMN IF NOT EXISTS income_type income_type NOT NULL DEFAULT 'INDIVIDUAL';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_income_transaction_income_type ON income_transaction(income_type);

-- Update existing records to have appropriate income_type based on category
-- Individual income types (typically from specific members)
UPDATE income_transaction 
SET income_type = 'INDIVIDUAL' 
WHERE category IN ('TITHE', 'MASS_OFFERING', 'WEDDING_FEE', 'BAPTISM_FEE', 'FUNERAL_FEE', 'CERTIFICATE_FEE');

-- Group income types (typically from groups or general collections)
UPDATE income_transaction 
SET income_type = 'GROUP' 
WHERE category IN ('OFFERTORY', 'THANKSGIVING', 'DONATION', 'FUNDRAISING', 'RENT_INCOME', 'INVESTMENT_INCOME', 'OTHER_INCOME');

-- Add comment to document the new column
COMMENT ON COLUMN income_transaction.income_type IS 'Type of income: INDIVIDUAL (from specific members) or GROUP (from collections/groups)';

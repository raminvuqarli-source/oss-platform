-- Migration 0015: Add financial settings to properties and payroll_configs

ALTER TABLE properties 
  ADD COLUMN IF NOT EXISTS country_tax_rate integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS utility_expense_pct integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cleaning_expense_monthly integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS default_employee_tax_rate integer DEFAULT 0;

ALTER TABLE payroll_configs
  ADD COLUMN IF NOT EXISTS employee_tax_rate integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS additional_expenses_monthly integer DEFAULT 0;

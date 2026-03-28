-- Migration 0016: Add additional_expenses_monthly to properties table

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS additional_expenses_monthly integer DEFAULT 0;

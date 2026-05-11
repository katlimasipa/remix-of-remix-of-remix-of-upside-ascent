ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deriv_api_token text,
  ADD COLUMN IF NOT EXISTS deriv_account_id text,
  ADD COLUMN IF NOT EXISTS deriv_currency text;
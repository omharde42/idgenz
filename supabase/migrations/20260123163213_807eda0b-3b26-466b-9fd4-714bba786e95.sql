-- Create table to track authentication attempts for rate limiting
CREATE TABLE public.auth_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL, -- email or IP address
  attempt_type TEXT NOT NULL, -- 'login' or 'signup'
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT false
);

-- Create index for efficient lookups
CREATE INDEX idx_auth_rate_limits_identifier_type ON public.auth_rate_limits(identifier, attempt_type, attempted_at);

-- Create function to clean up old rate limit records (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.auth_rate_limits WHERE attempted_at < now() - INTERVAL '1 hour';
END;
$$;

-- Create function to check rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_attempt_type TEXT,
  p_max_attempts INTEGER DEFAULT 5,
  p_window_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  attempt_count INTEGER;
BEGIN
  -- Count failed attempts in the time window
  SELECT COUNT(*) INTO attempt_count
  FROM public.auth_rate_limits
  WHERE identifier = p_identifier
    AND attempt_type = p_attempt_type
    AND success = false
    AND attempted_at > now() - (p_window_minutes || ' minutes')::INTERVAL;
  
  RETURN attempt_count < p_max_attempts;
END;
$$;

-- Create function to record an attempt
CREATE OR REPLACE FUNCTION public.record_auth_attempt(
  p_identifier TEXT,
  p_attempt_type TEXT,
  p_success BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.auth_rate_limits (identifier, attempt_type, success)
  VALUES (p_identifier, p_attempt_type, p_success);
  
  -- Clean up old records occasionally (1% chance per request)
  IF random() < 0.01 THEN
    PERFORM public.cleanup_old_rate_limits();
  END IF;
END;
$$;

-- Grant execute permissions on functions to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.check_rate_limit TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_auth_attempt TO anon, authenticated;

-- Enable RLS but allow function access
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

-- No direct table access - only through functions
-- The functions use SECURITY DEFINER to bypass RLS
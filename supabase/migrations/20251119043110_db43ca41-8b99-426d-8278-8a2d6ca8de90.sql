-- Add additional_notes column to system_configuration
ALTER TABLE public.system_configuration 
ADD COLUMN additional_notes TEXT NULL;

COMMENT ON COLUMN public.system_configuration.additional_notes IS 'Custom observations and context that can be added to the AI system prompt';
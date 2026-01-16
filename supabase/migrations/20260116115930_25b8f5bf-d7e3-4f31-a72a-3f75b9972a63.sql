-- Create storage bucket for ID card images
INSERT INTO storage.buckets (id, name, public)
VALUES ('id-cards', 'id-cards', true);

-- Storage policies for id-cards bucket
CREATE POLICY "Users can upload their own ID cards"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'id-cards' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own ID cards"
ON storage.objects FOR SELECT
USING (bucket_id = 'id-cards' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own ID cards"
ON storage.objects FOR DELETE
USING (bucket_id = 'id-cards' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create saved_id_cards table
CREATE TABLE public.saved_id_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  institution_name TEXT,
  image_url TEXT NOT NULL,
  config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_id_cards ENABLE ROW LEVEL SECURITY;

-- RLS policies for saved_id_cards
CREATE POLICY "Users can view their own saved ID cards"
ON public.saved_id_cards FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved ID cards"
ON public.saved_id_cards FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved ID cards"
ON public.saved_id_cards FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved ID cards"
ON public.saved_id_cards FOR DELETE
USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_saved_id_cards_updated_at
BEFORE UPDATE ON public.saved_id_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
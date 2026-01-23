-- Make id-cards bucket private for better security
UPDATE storage.buckets SET public = false WHERE id = 'id-cards';
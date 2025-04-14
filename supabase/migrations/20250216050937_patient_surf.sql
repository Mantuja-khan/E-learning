/*
  # Update storage policies for notes-pdfs bucket

  1. Changes
    - Make notes-pdfs bucket public for authenticated users
    - Allow all authenticated users to download PDFs
    - Keep upload/delete restricted to admins
*/

-- Update bucket to be public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'notes-pdfs';

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public download of PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin to upload PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin to delete PDFs" ON storage.objects;

-- Create new policies
CREATE POLICY "Allow authenticated users to download PDFs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'notes-pdfs' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow admins to upload PDFs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'notes-pdfs' 
  AND EXISTS (
    SELECT 1 FROM admin_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'sub_admin')
  )
);

CREATE POLICY "Allow admins to delete PDFs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'notes-pdfs'
  AND EXISTS (
    SELECT 1 FROM admin_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'sub_admin')
  )
);
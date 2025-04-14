/*
  # Fix Storage Policies

  1. Changes
     - Ensures storage bucket 'notes-pdfs' is public
     - Safely recreates storage policies with unique names to avoid conflicts
  
  2. Security
     - Maintains proper access control for PDFs
     - Only authenticated users can download PDFs
     - Only admins and sub-admins can upload and delete PDFs
*/

-- Update bucket to be public if not already
UPDATE storage.buckets 
SET public = true 
WHERE id = 'notes-pdfs';

-- Drop existing policies if they exist (using IF EXISTS to avoid errors)
DROP POLICY IF EXISTS "Allow authenticated users to download PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to upload PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to delete PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Allow public download of PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin to upload PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin to delete PDFs" ON storage.objects;

-- Create new policies with unique names to avoid conflicts
DO $$
BEGIN
  -- Check if the policy already exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'notes_pdfs_download_policy'
  ) THEN
    CREATE POLICY "notes_pdfs_download_policy"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'notes-pdfs' 
      AND auth.role() = 'authenticated'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'notes_pdfs_upload_policy'
  ) THEN
    CREATE POLICY "notes_pdfs_upload_policy"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'notes-pdfs' 
      AND EXISTS (
        SELECT 1 FROM admin_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'sub_admin')
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'notes_pdfs_delete_policy'
  ) THEN
    CREATE POLICY "notes_pdfs_delete_policy"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'notes-pdfs'
      AND EXISTS (
        SELECT 1 FROM admin_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'sub_admin')
      )
    );
  END IF;
END $$;
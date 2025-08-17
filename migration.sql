-- Step 1: Add the user_id column to your fuel_records table
ALTER TABLE public.fuel_records
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Remove the old, insecure "allow anonymous" policies
DROP POLICY IF EXISTS "allow anon read" ON public.fuel_records;
DROP POLICY IF EXISTS "allow anon insert" ON public.fuel_records;
DROP POLICY IF EXISTS "allow anon delete" ON public.fuel_records;

-- Step 3: Create new, secure policies for logged-in users
-- Allows users to view their own records
CREATE POLICY "Users can view their own records"
ON public.fuel_records FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allows users to insert records for themselves
CREATE POLICY "Users can insert their own records"
ON public.fuel_records FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allows users to update their own records
CREATE POLICY "Users can update their own records"
ON public.fuel_records FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Allows users to delete their own records
CREATE POLICY "Users can delete their own records"
ON public.fuel_records FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

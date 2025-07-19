/*
  # Create profiles and training tables

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `subscribed_to_emails` (boolean, default false)
    - `user_training_plans`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `plan_name` (text)
      - `plan_data` (jsonb)
      - `created_at` (timestamp)
    - `user_fitness_settings`
      - `user_id` (uuid, primary key, references auth.users)
      - `initial_fitness` (numeric)
      - `initial_fatigue` (numeric)
      - `plan_start_date` (date)
      - `updated_at` (timestamp)
    - `user_daily_tss_records`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `workout_date` (date)
      - `actual_tss` (numeric)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  subscribed_to_emails boolean DEFAULT false NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile."
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile."
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create user_training_plans table
CREATE TABLE IF NOT EXISTS user_training_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name text NOT NULL,
  plan_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, plan_name)
);

ALTER TABLE user_training_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own training plans."
  ON user_training_plans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own training plans."
  ON user_training_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own training plans."
  ON user_training_plans
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own training plans."
  ON user_training_plans
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create user_fitness_settings table
CREATE TABLE IF NOT EXISTS user_fitness_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  initial_fitness numeric NOT NULL,
  initial_fatigue numeric NOT NULL,
  plan_start_date date NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_fitness_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own fitness settings."
  ON user_fitness_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own fitness settings."
  ON user_fitness_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fitness settings."
  ON user_fitness_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create user_daily_tss_records table
CREATE TABLE IF NOT EXISTS user_daily_tss_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_date date NOT NULL,
  actual_tss numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, workout_date)
);

ALTER TABLE user_daily_tss_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily TSS records."
  ON user_daily_tss_records
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily TSS records."
  ON user_daily_tss_records
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily TSS records."
  ON user_daily_tss_records
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily TSS records."
  ON user_daily_tss_records
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
/*
  # Initial Schema for Warung Ansel App

  1. New Tables
    - `profiles`
      - `id` (uuid, references auth.users)
      - `email` (text)
      - `role` (text, default 'user')
      - `created_at` (timestamp)
    
    - `breakfast_items`
      - `id` (uuid, primary key)
      - `name` (text)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
    
    - `jastip_orders`
      - `id` (uuid, primary key)  
      - `name` (text)
      - `breakfast` (text)
      - `coffee` (text)
      - `created_at` (timestamp)
    
    - `eri_catering_orders`
      - `id` (uuid, primary key)
      - `name` (text)
      - `created_at` (timestamp)
    
    - `eri_catering_menu`
      - `id` (uuid, primary key)
      - `weekly_menu` (text)
      - `updated_at` (timestamp)
    
    - `food_items`
      - `id` (uuid, primary key)
      - `name` (text)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
    
    - `warung_audit_orders`
      - `id` (uuid, primary key)
      - `name` (text)
      - `food` (text)
      - `quantity` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access to menu items
    - Add policies for authenticated users to manage data
    - Add policies for admin role management
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz DEFAULT now()
);

-- Create breakfast items table
CREATE TABLE IF NOT EXISTS breakfast_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create jastip orders table
CREATE TABLE IF NOT EXISTS jastip_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  breakfast text NOT NULL,
  coffee text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create eri catering orders table
CREATE TABLE IF NOT EXISTS eri_catering_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create eri catering menu table
CREATE TABLE IF NOT EXISTS eri_catering_menu (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_menu text NOT NULL DEFAULT 'Menu akan diupdate setiap minggu',
  updated_at timestamptz DEFAULT now()
);

-- Create food items table
CREATE TABLE IF NOT EXISTS food_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create warung audit orders table
CREATE TABLE IF NOT EXISTS warung_audit_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  food text NOT NULL,
  quantity integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakfast_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE jastip_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE eri_catering_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE eri_catering_menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE warung_audit_orders ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Menu items policies (public read, admin write)
CREATE POLICY "Breakfast items are publicly readable"
  ON breakfast_items
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage breakfast items"
  ON breakfast_items
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Food items are publicly readable"
  ON food_items
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage food items"
  ON food_items
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Eri catering menu is publicly readable"
  ON eri_catering_menu
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage eri catering menu"
  ON eri_catering_menu
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

-- Orders policies (public insert, admin read/manage)
CREATE POLICY "Anyone can submit jastip orders"
  ON jastip_orders
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only admins can view jastip orders"
  ON jastip_orders
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Only admins can manage jastip orders"
  ON jastip_orders
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Anyone can submit eri catering orders"
  ON eri_catering_orders
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only admins can view eri catering orders"
  ON eri_catering_orders
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Only admins can manage eri catering orders"
  ON eri_catering_orders
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Anyone can submit warung audit orders"
  ON warung_audit_orders
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only admins can view warung audit orders"
  ON warung_audit_orders
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Only admins can manage warung audit orders"
  ON warung_audit_orders
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

-- Insert default data
INSERT INTO breakfast_items (name) VALUES 
  ('Nasi Gudeg'),
  ('Nasi Pecel'),
  ('Lontong Sayur'),
  ('Bubur Ayam'),
  ('Nasi Rames')
ON CONFLICT DO NOTHING;

INSERT INTO food_items (name) VALUES 
  ('Ayam Penyet'),
  ('Nasi Padang'),
  ('Mie Ayam'),
  ('Bakso'),
  ('Gado-gado'),
  ('Soto Ayam')
ON CONFLICT DO NOTHING;

INSERT INTO eri_catering_menu (weekly_menu) VALUES 
  ('Menu Minggu Ini: Senin - Ayam Rica, Selasa - Rendang, Rabu - Ikan Bakar, Kamis - Ayam Teriyaki, Jumat - Bebek Goreng')
ON CONFLICT DO NOTHING;
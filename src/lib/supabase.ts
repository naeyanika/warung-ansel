import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
};

export type BreakfastItem = {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
};

export type JastipOrder = {
  id: string;
  name: string;
  breakfast: string;
  coffee: string;
  created_at: string;
};

export type EriCateringOrder = {
  id: string;
  name: string;
  created_at: string;
};

export type EriCateringMenu = {
  id: string;
  weekly_menu: string;
  updated_at: string;
};

export type FoodItem = {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
};

export type WarungAuditOrder = {
  id: string;
  name: string;
  food: string;
  quantity: number;
  created_at: string;
};
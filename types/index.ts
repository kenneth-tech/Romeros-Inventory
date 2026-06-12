export interface Branch {
  id: string;
  name: string;
  address: string;
  created_at: string;
}

export interface Part {
  id: string;
  branch_id: string;
  part_number: string;
  product_name: string;
  category: string;
  vehicle_compatibility: string;
  stock: number;
  min_stock: number;
  cost_price: number;
  selling_price: number;
  supplier: string;
  location: string;
  created_at: string;
}

export interface StockMovement {
  id: string;
  branch_id: string;
  part_id: string;
  type: "IN" | "OUT";
  quantity: number;
  reference: string;
  remarks: string;
  date: string;
  user_id: string | null;
  created_at: string;
}

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
}

export interface MonthlyReport {
  id: string;
  branch_id: string;
  month: number;
  year: number;
  generated_by: string;
  file_url: string | null;
  created_at: string;
}

export interface ServiceRecord {
  id: string;
  customer_name: string;
  vehicle_model: string;
  plate_number: string;
  service_type: string;
  date: string;
}

export interface MonthlyReportRow {
  part_number: string;
  product_name: string;
  beginning: number;
  received: number;
  used_sold: number;
  ending: number;
}

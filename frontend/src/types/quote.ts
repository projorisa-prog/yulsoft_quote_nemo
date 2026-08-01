export type BuildingType = 'OFFICE' | 'HOSPITAL' | 'ACADEMY' | 'KINDERGARTEN' | 'STORE' | 'FACTORY' | 'ETC';
export type DiscountType = 'NONE' | 'PERCENT' | 'AMOUNT';
export type DesignKey = 'classic' | 'modern' | 'color';
export type PresetFrequency = 'WEEKLY_1' | 'WEEKLY_2' | 'WEEKLY_3' | 'WEEKLY_5' | 'DAILY';
export type DaysOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
export type UserPlan = 'FREE' | 'PRO' | 'ENTERPRISE';
export type QuoteStatus = 'DRAFT' | 'COMPLETED' | 'CONVERTED' | 'EXPIRED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';

export interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  zipcode: string;
  detail_address: string;
  building_type: BuildingType;
  area_pyeong: string;
}

export interface SupplierInfo {
  biz_reg_no: string;
  company_name: string;
  ceo_name: string;
  address: string;
  business_type: string;
  business_item: string;
  phone: string;
  email: string;
}

export interface QuoteItemRequest {
  area: string;
  task: string;
  days: DaysOfWeek[];
  price: number;
  exclude_area: string;
  memo: string;
}

export interface CalculationRequest {
  items: QuoteItemRequest[];
  discount_type: DiscountType;
  discount_value: number;
  vat_included: boolean;
  vat_rate: number;
}

export interface QuoteCreateRequest {
  customer: CustomerInfo;
  supplier: SupplierInfo;
  calculation: CalculationRequest;
  design_key: DesignKey;
  expires_days: number;
  preset_frequency?: PresetFrequency;
}

export interface QuoteItemResponse {
  area: string;
  task: string;
  days: DaysOfWeek[];
  price: number;
  exclude_area: string;
  memo: string;
}

export interface TotalsResponse {
  subtotal: number;
  discount_amount: number;
  taxable_amount: number;
  vat_amount: number;
  grand_total: number;
}

export interface QuotePreviewResponse {
  items: QuoteItemResponse[];
  totals: TotalsResponse;
}

export interface QuoteCreateResponse {
  id: string;
  quote_number: string;
  status: string;
  public_url: string;
  pdf_url: string;
  expires_at: string;
  watermark_text: string;
  created_at: string;
}

export interface QuoteViewResponse {
  id: string;
  quote_number: string;
  status: string;
  customer_info: CustomerInfo;
  supplier_info: SupplierInfo;
  items: QuoteItemResponse[];
  totals: TotalsResponse;
  design_key: DesignKey;
  watermark_text: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  calculation_snapshot: CalculationRequest;
}

export interface ErrorDetail {
  code: string;
  message: string;
  details?: Record<string, string>;
}

export interface ErrorResponse {
  error: ErrorDetail;
}

// User & Auth
export interface User {
  id: string;
  email: string;
  company_name: string | null;
  plan: UserPlan;
}

export interface RegisterRequest {
  email: string;
  password: string;
  company_name: string;
  ceo_name: string;
  biz_reg_no: string;
  company_address: {
    zipcode: string;
    road: string;
    detail: string;
  };
  phone: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    company_name: string | null;
    plan: UserPlan;
  }
}

// Template
export interface Template {
  id: string;
  name: string;
  description: string | null;
  items: QuoteItemRequest[];
  calculation_snapshot: CalculationRequest;
  is_public: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateListResponse {
  items: {
    id: string;
    name: string;
    description: string | null;
    item_count: number;
    usage_count: number;
    created_at: string;
    updated_at: string;
  }[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Payment
export interface PaymentHistory {
  id: string;
  plan: UserPlan;
  amount: number;
  status: PaymentStatus;
  paid_at: string | null;
  expires_at: string | null;
  created_at: string;
}

// Company Info
export interface CompanyInfo {
  biz_reg_no: string;
  company_name: string;
  ceo_name: string;
  address: string;
  business_type: string;
  business_item: string;
  phone: string;
  email: string;
  bank_info: {
    bank_name: string;
    account_no: string;
    account_holder: string;
  } | null;
}

// My Quotes
export interface MyQuoteListResponse {
  items: {
    id: string;
    quote_number: string;
    status: string;
    customer_name: string;
    grand_total: number;
    design_key: DesignKey;
    created_at: string;
  }[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
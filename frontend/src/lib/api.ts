import type { QuotePreviewResponse, QuoteCreateResponse, QuoteViewResponse } from '@/types/quote';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: '알 수 없는 오류' } }));
    throw new Error(error.error?.message || `HTTP ${response.status}`);
  }
  return response.json();
}

export const api = {
  async previewQuote(data: QuoteCreateRequest): Promise<QuotePreviewResponse> {
    const response = await fetch(`${API_BASE}/quotes/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async createQuote(data: QuoteCreateRequest): Promise<QuoteCreateResponse> {
    const response = await fetch(`${API_BASE}/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async getQuote(id: string): Promise<QuoteViewResponse> {
    const response = await fetch(`${API_BASE}/quotes/${id}`);
    return handleResponse(response);
  },

  async downloadPdf(id: string): Promise<Blob> {
    const response = await fetch(`${API_BASE}/quotes/${id}/pdf`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'PDF 다운로드 실패' } }));
      throw new Error(error.error?.message || 'PDF 다운로드 실패');
    }
    return response.blob();
  },
};

export type QuoteCreateRequest = {
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
    detail_address: string;
    building_type: string;
    area_pyeong: string;
  };
  supplier: {
    biz_reg_no: string;
    company_name: string;
    ceo_name: string;
    address: string;
    business_type: string;
    business_item: string;
    phone: string;
    email: string;
  };
  calculation: {
    items: Array<{
      area: string;
      task: string;
      days: string[];
      qty: number;
      unit_price: number;
      exclude_area: string;
      memo: string;
    }>;
    discount_type: string;
    discount_value: number;
    vat_included: boolean;
    vat_rate: number;
  };
  design_key: string;
  expires_days: number;
};
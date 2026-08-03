import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CustomerInfo,
  SupplierInfo,
  QuoteItemRequest,
  CalculationRequest,
  DesignKey,
  QuoteCreateRequest,
  TotalsResponse,
  UserPlan,
} from '@/types/quote';

interface User {
  id: string;
  email: string;
  company_name: string | null;
  plan: UserPlan;
}

interface AuthState {
  // Auth
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  
  // Quote data (from Phase 1)
  currentStep: number;
  quoteData: {
    customer: CustomerInfo;
    supplier: SupplierInfo;
    items: QuoteItemRequest[];
    calculation: CalculationRequest;
    design_key: DesignKey;
    expires_days: number;
  };
  lastQuoteId: string | null;
  isSubmitting: boolean;
  
  // Template data (new)
  templateId: string | null;
  
  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  updateUser: (data: Partial<User>) => void;
  
  // Quote actions (from Phase 1)
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateCustomer: (data: Partial<CustomerInfo>) => void;
  updateSupplier: (data: Partial<SupplierInfo>) => void;
  setItems: (items: QuoteItemRequest[]) => void;
  addItem: (item: QuoteItemRequest) => void;
  updateItem: (index: number, item: QuoteItemRequest) => void;
  removeItem: (index: number) => void;
  updateCalculation: (data: Partial<CalculationRequest>) => void;
  setDesignKey: (key: DesignKey) => void;
  updateDesign: (data: { expires_days?: number }) => void;
  getCalculatedTotals: () => TotalsResponse;
  setSubmitting: (value: boolean) => void;
  setLastQuoteId: (id: string | null) => void;
  setTemplateId: (id: string | null) => void;
  reset: () => void;
  submitQuote: () => Promise<void>;
  
  // Template actions (new)
  applyTemplate: (template: { items: QuoteItemRequest[]; calculation_snapshot?: CalculationRequest }) => void;
}

const initialCustomer: CustomerInfo = {
  name: '',
  phone: '',
  email: '',
  address: '',
  zipcode: '',
  detail_address: '',
  building_type: 'OFFICE',
  area_pyeong: '',
};

const initialSupplier: SupplierInfo = {
  biz_reg_no: '',
  company_name: '율소프트',
  ceo_name: '홍길동',
  address: '서울특별시 강남구 테헤란로 123',
  business_type: '서비스업',
  business_item: '소프트웨어 개발 및 공급',
  phone: '02-1234-5678',
  email: 'contact@yulsoft.kr',
};

const initialCalculation: CalculationRequest = {
  items: [],
  discount_type: 'NONE',
  discount_value: 0,
  vat_included: false,
  vat_rate: 0.1,
};

const initialState = {
  // Auth
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  
  // Quote
  currentStep: 1,
  quoteData: {
    customer: initialCustomer,
    supplier: initialSupplier,
    items: [],
    calculation: initialCalculation,
    design_key: 'classic' as DesignKey,
    expires_days: 30,
  },
  lastQuoteId: null,
  isSubmitting: false,
  templateId: null,
};

export const useQuoteStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Auth actions
      setAuth: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),
      
      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
      
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
      
      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),
      
      // Quote actions
      setCurrentStep: (step) => set({ currentStep: step }),
      nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 4) })),
      prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),
      
      updateCustomer: (data) =>
        set((state) => ({
          quoteData: {
            ...state.quoteData,
            customer: { ...state.quoteData.customer, ...data },
          },
        })),
      
      updateSupplier: (data) =>
        set((state) => ({
          quoteData: {
            ...state.quoteData,
            supplier: { ...state.quoteData.supplier, ...data },
          },
        })),
      
      setItems: (items) =>
        set((state) => ({
          quoteData: {
            ...state.quoteData,
            items: items.map((item, i) => ({ ...item, sort_order: i + 1 })),
            calculation: { ...state.quoteData.calculation, items },
          },
        })),
      
      addItem: (item) =>
        set((state) => {
          const newItem = { ...item, sort_order: state.quoteData.items.length + 1 };
          const items = [...state.quoteData.items, newItem];
          return {
            quoteData: {
              ...state.quoteData,
              items,
              calculation: { ...state.quoteData.calculation, items },
            },
          };
        }),
      
      updateItem: (index, item) =>
        set((state) => {
          const items = [...state.quoteData.items];
          items[index] = { ...items[index], ...item };
          return {
            quoteData: {
              ...state.quoteData,
              items,
              calculation: { ...state.quoteData.calculation, items },
            },
          };
        }),
      
      removeItem: (index) =>
        set((state) => {
          const items = state.quoteData.items.filter((_, i) => i !== index);
          return {
            quoteData: {
              ...state.quoteData,
              items: items.map((item, i) => ({ ...item, sort_order: i + 1 })),
              calculation: { ...state.quoteData.calculation, items },
            },
          };
        }),
      
      updateCalculation: (data) =>
        set((state) => ({
          quoteData: {
            ...state.quoteData,
            calculation: { ...state.quoteData.calculation, ...data },
          },
        })),
      
      setDesignKey: (key) =>
        set((state) => ({
          quoteData: { ...state.quoteData, design_key: key },
        })),
      
      updateDesign: (data) =>
        set((state) => ({
          quoteData: { ...state.quoteData, ...data },
        })),
      
      getCalculatedTotals: () => {
        const { items, discount_type, discount_value, vat_included, vat_rate } = get().quoteData.calculation;
        
        const subtotal = items.reduce((sum, item) => sum + item.price, 0);
        
        let discount_amount = 0;
        if (discount_type === 'PERCENT') {
          discount_amount = Math.round(subtotal * discount_value / 100);
        } else if (discount_type === 'AMOUNT') {
          discount_amount = Math.min(discount_value, subtotal);
        }
        
        const taxable_amount = subtotal - discount_amount;
        let vat_amount = 0;
        if (vat_rate > 0) {
          if (vat_included) {
            vat_amount = Math.round(taxable_amount * vat_rate / (1 + vat_rate));
          } else {
            vat_amount = Math.round(taxable_amount * vat_rate);
          }
        }
        
        const grand_total = vat_included ? taxable_amount : taxable_amount + vat_amount;
        
        return { subtotal, discount_amount, taxable_amount, vat_amount, grand_total };
      },
      
      setSubmitting: (value) => set({ isSubmitting: value }),
      setLastQuoteId: (id) => set({ lastQuoteId: id }),
      setTemplateId: (id) => set({ templateId: id }),
      
      reset: () => set({ ...initialState, lastQuoteId: get().lastQuoteId }),
      
      // Template actions
      applyTemplate: (template) =>
        set((state) => ({
          quoteData: {
            ...state.quoteData,
            items: template.items,
            calculation: {
              ...state.quoteData.calculation,
              items: template.items,
              ...template.calculation_snapshot,
            },
          },
        })),
      
      submitQuote: async () => {
        const state = get();
        set({ isSubmitting: true });
        
        try {
          const payload: QuoteCreateRequest = {
            customer: state.quoteData.customer,
            supplier: state.quoteData.supplier,
            calculation: state.quoteData.calculation,
            design_key: state.quoteData.design_key,
            expires_days: state.quoteData.expires_days,
          };
          
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://yulsoft-quote-nemo-backend.onrender.com/api/v1'}/quotes`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload),
                    });

                    // 응답 텍스트를 먼저 읽어서 재사용 가능하게 함
                    const responseText = await response.text();

                    if (!response.ok) {
                      let errorMessage = '견적서 생성 실패';
                      try {
                        const error = JSON.parse(responseText);
                        errorMessage = error.error?.message || errorMessage;
                      } catch {
                        errorMessage = `서버 오류 (${response.status}): ${responseText.substring(0, 200)}`;
                      }
                      throw new Error(errorMessage);
                    }

                    let data;
                    try {
                      data = JSON.parse(responseText);
                    } catch {
                      console.error('Response parsing failed. Status:', response.status, 'Body:', responseText.substring(0, 500));
                      throw new Error('응답 데이터 파싱 실패: ' + (responseText.substring(0, 200) || '빈 응답'));
                    }
                    set({ lastQuoteId: data.id, isSubmitting: false });
        } catch (error) {
          set({ isSubmitting: false });
          throw error;
        }
      },
    }),
    {
      name: 'quote-storage',
      partialize: (state) => ({
        quoteData: state.quoteData,
        currentStep: state.currentStep,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
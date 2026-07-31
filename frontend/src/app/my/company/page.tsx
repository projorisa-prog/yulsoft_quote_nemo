'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuoteStore } from '@/store/quoteStore';

interface CompanyInfo {
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

export default function MyCompanyPage() {
  const router = useRouter();
  const { accessToken, user } = useQuoteStore();
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    biz_reg_no: '',
    company_name: '',
    ceo_name: '',
    address: '',
    business_type: '',
    business_item: '',
    phone: '',
    email: '',
    bank_info: {
      bank_name: '',
      account_no: '',
      account_holder: '',
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!accessToken) {
      router.push('/auth/login');
      return;
    }
    fetchCompanyInfo();
  }, [accessToken, router]);

  const fetchCompanyInfo = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/backend/my/company-info', {
        headers: { Authorization: `Bearer ${useQuoteStore.getState().accessToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        setCompanyInfo({
          biz_reg_no: data.biz_reg_no || '',
          company_name: data.company_name || '',
          ceo_name: data.ceo_name || '',
          address: data.address || '',
          business_type: data.business_type || '',
          business_item: data.business_item || '',
          phone: data.phone || '',
          email: data.email || '',
          bank_info: data.bank_info || {
            bank_name: '',
            account_no: '',
            account_holder: '',
          },
        });
      }
    } catch (err) {
      console.error('Failed to fetch company info:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    if (field.startsWith('bank_info.')) {
      const subField = field.replace('bank_info.', '');
      setCompanyInfo((prev) => ({
        ...prev,
        bank_info: {
          ...prev.bank_info,
          [subField]: value,
        } as any,
      }));
    } else {
      setCompanyInfo((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/backend/my/company-info', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${useQuoteStore.getState().accessToken}`,
        },
        body: JSON.stringify(companyInfo),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || '저장에 실패했습니다.');
      }

      setMessage({ type: 'success', text: '회사 정보가 저장되었습니다.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : '저장에 실패했습니다.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-primary-900">
              율소프트 견적서
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">회사 정보 설정</h1>
          <p className="text-gray-600 mt-1">
            견적서에 자동으로 채워질 공급자 정보를 입력하세요.
          </p>
        </div>

        {message && (
          <div className={`rounded-lg p-4 mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} id="company-form" className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="biz_reg_no" className="label">사업자등록번호 <span className="text-red-500">*</span></label>
                <input
                  id="biz_reg_no"
                  type="text"
                  required
                  maxLength={12}
                  value={companyInfo.biz_reg_no}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    let formatted = value;
                    if (value.length > 3 && value.length <= 5) {
                      formatted = `${value.slice(0, 3)}-${value.slice(3)}`;
                    } else if (value.length > 5) {
                      formatted = `${value.slice(0, 3)}-${value.slice(3, 5)}-${value.slice(5)}`;
                    }
                    handleChange('biz_reg_no', formatted);
                  }}
                  className="input"
                  placeholder="123-45-67890"
                />
              </div>
              <div>
                <label htmlFor="company_name" className="label">회사명 <span className="text-red-500">*</span></label>
                <input
                  id="company_name"
                  type="text"
                  required
                  value={companyInfo.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  className="input"
                  placeholder="율소프트 청소"
                />
              </div>
              <div>
                <label htmlFor="ceo_name" className="label">대표자명 <span className="text-red-500">*</span></label>
                <input
                  id="ceo_name"
                  type="text"
                  required
                  value={companyInfo.ceo_name}
                  onChange={(e) => handleChange('ceo_name', e.target.value)}
                  className="input"
                  placeholder="홍길동"
                />
              </div>
              <div>
                <label htmlFor="phone" className="label">연락처 <span className="text-red-500">*</span></label>
                <input
                  id="phone"
                  type="tel"
                  required
                  maxLength={13}
                  value={companyInfo.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    let formatted = value;
                    if (value.length > 3 && value.length <= 7) {
                      formatted = `${value.slice(0, 3)}-${value.slice(3)}`;
                    } else if (value.length > 7) {
                      formatted = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7)}`;
                    }
                    handleChange('phone', formatted);
                  }}
                  className="input"
                  placeholder="010-1234-5678"
                />
              </div>
              <div>
                <label htmlFor="email" className="label">이메일 <span className="text-red-500">*</span></label>
                <input
                  id="email"
                  type="email"
                  required
                  value={companyInfo.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="input"
                  placeholder="company@example.com"
                />
              </div>
              <div>
                <label htmlFor="address" className="label">주소 <span className="text-red-500">*</span></label>
                <input
                  id="address"
                  type="text"
                  required
                  value={companyInfo.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="input"
                  placeholder="서울시 마포구 월드컵로 456"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="business_type" className="label">업태</label>
                  <input
                    id="business_type"
                    type="text"
                    value={companyInfo.business_type}
                    onChange={(e) => handleChange('business_type', e.target.value)}
                    className="input"
                    placeholder="서비스업"
                  />
                </div>
                <div>
                  <label htmlFor="business_item" className="label">종목</label>
                  <input
                    id="business_item"
                    type="text"
                    value={companyInfo.business_item}
                    onChange={(e) => handleChange('business_item', e.target.value)}
                    className="input"
                    placeholder="청소업"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">계좌 정보 (선택)</h2>
            <p className="text-sm text-gray-500 mb-4">견적서에 계좌 정보를 표시하려면 입력하세요.</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="bank_name" className="label">은행명</label>
                <input
                  id="bank_name"
                  type="text"
                  value={companyInfo.bank_info?.bank_name || ''}
                  onChange={(e) => handleChange('bank_info.bank_name', e.target.value)}
                  className="input"
                  placeholder="신한은행"
                />
              </div>
              <div>
                <label htmlFor="account_no" className="label">계좌번호</label>
                <input
                  id="account_no"
                  type="text"
                  value={companyInfo.bank_info?.account_no || ''}
                  onChange={(e) => handleChange('bank_info.account_no', e.target.value)}
                  className="input"
                  placeholder="110-123-456789"
                />
              </div>
              <div>
                <label htmlFor="account_holder" className="label">예금주</label>
                <input
                  id="account_holder"
                  type="text"
                  value={companyInfo.bank_info?.account_holder || ''}
                  onChange={(e) => handleChange('bank_info.account_holder', e.target.value)}
                  className="input"
                  placeholder="율소프트 청소"
                />
              </div>
            </div>
          </div>
        </form>

        <div className="mt-8 flex gap-4">
          <button
            type="submit"
            form="company-form"
            disabled={saving}
            className="btn-accent flex-1 py-3 text-lg"
          >
            {saving ? '저장 중...' : '저장하기'}
          </button>
          <Link
            href="/dashboard"
            className="btn-secondary flex-1 py-3 text-lg text-center"
          >
            취소
          </Link>
        </div>
      </main>
    </div>
  );
}
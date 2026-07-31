'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuoteStore } from '@/store/quoteStore';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useQuoteStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    company_name: '',
    ceo_name: '',
    biz_reg_no: '',
    zipcode: '',
    road: '',
    detail: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = '이메일을 입력해주세요.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = '올바른 이메일 형식이 아닙니다.';
    if (!formData.password) newErrors.password = '비밀번호를 입력해주세요.';
    else if (formData.password.length < 8) newErrors.password = '비밀번호는 8자 이상이어야 합니다.';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    if (!formData.company_name) newErrors.company_name = '회사명을 입력해주세요.';
    if (!formData.ceo_name) newErrors.ceo_name = '대표자명을 입력해주세요.';
    if (!formData.biz_reg_no) newErrors.biz_reg_no = '사업자등록번호를 입력해주세요.';
    else if (!/^\d{10}$/.test(formData.biz_reg_no.replace(/-/g, ''))) newErrors.biz_reg_no = '사업자등록번호는 10자리 숫자입니다.';
    if (!formData.zipcode) newErrors.zipcode = '우편번호를 입력해주세요.';
    if (!formData.road) newErrors.road = '도로명 주소를 입력해주세요.';
    if (!formData.phone) newErrors.phone = '연락처를 입력해주세요.';
    else if (!/^01[0-9]-?\d{4}-?\d{4}$/.test(formData.phone.replace(/-/g, ''))) newErrors.phone = '올바른 휴대폰 번호 형식이 아닙니다.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setError('');
    setLoading(true);

    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        company_name: formData.company_name,
        ceo_name: formData.ceo_name,
        biz_reg_no: formData.biz_reg_no.replace(/-/g, ''),
        company_address: { zipcode: formData.zipcode, road: formData.road, detail: formData.detail },
        phone: formData.phone.replace(/-/g, ''),
      };

      const res = await fetch('/api/backend/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || '회원가입에 실패했습니다.');
      }

      const data = await res.json();
      useQuoteStore.getState().setAuth(data.user, data.access_token, data.refresh_token);
      router.push('/plans');
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSearch = () => {
    alert('다음 주소 API 연동 필요 (NEXT_PUBLIC_DAUM_POSTCODE_KEY 설정 필요)');
  };

  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? <p className="text-red-500 text-xs mt-1">{errors[field]}</p> : null;

  return (
    <div className="min-h-screen bg-[#f0f4ff] flex flex-col items-center justify-center py-12 px-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-white" viewBox="0 0 16 16" fill="none">
            <path d="M2 5h12M2 8h9M2 11h6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="text-xl font-bold text-gray-900">율소프트</span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-blue-100 shadow-card p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">회원가입</h1>
        <p className="text-sm text-gray-500 mb-7">
          이미 계정이 있으신가요?{' '}
          <Link href="/auth/login" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
            로그인
          </Link>
        </p>

        {error && (
          <div className="mb-5 flex items-start gap-2 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 계정 정보 */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
              이메일 / 비밀번호
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="reg-email" className="label">이메일 <span className="text-red-500">*</span></label>
                <input
                  id="reg-email" type="email" autoComplete="email" required
                  value={formData.email} onChange={(e) => handleChange('email', e.target.value)}
                  className={`input ${errors.email ? 'input-error' : ''}`} placeholder="user@example.com"
                />
                <FieldError field="email" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-password" className="label">비밀번호 <span className="text-red-500">*</span></label>
                  <input
                    id="reg-password" type="password" autoComplete="new-password" required minLength={8}
                    value={formData.password} onChange={(e) => handleChange('password', e.target.value)}
                    className={`input ${errors.password ? 'input-error' : ''}`} placeholder="8자 이상"
                  />
                  <FieldError field="password" />
                </div>
                <div>
                  <label htmlFor="reg-confirm-password" className="label">비밀번호 확인 <span className="text-red-500">*</span></label>
                  <input
                    id="reg-confirm-password" type="password" autoComplete="new-password" required
                    value={formData.confirmPassword} onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    className={`input ${errors.confirmPassword ? 'input-error' : ''}`} placeholder="비밀번호 재입력"
                  />
                  <FieldError field="confirmPassword" />
                </div>
              </div>
            </div>
          </div>

          {/* 회사 정보 */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
              회사 정보
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-company-name" className="label">회사명 <span className="text-red-500">*</span></label>
                  <input
                    id="reg-company-name" type="text" required
                    value={formData.company_name} onChange={(e) => handleChange('company_name', e.target.value)}
                    className={`input ${errors.company_name ? 'input-error' : ''}`} placeholder="율소프트 청소"
                  />
                  <FieldError field="company_name" />
                </div>
                <div>
                  <label htmlFor="reg-ceo-name" className="label">대표자명 <span className="text-red-500">*</span></label>
                  <input
                    id="reg-ceo-name" type="text" required
                    value={formData.ceo_name} onChange={(e) => handleChange('ceo_name', e.target.value)}
                    className={`input ${errors.ceo_name ? 'input-error' : ''}`} placeholder="홍길동"
                  />
                  <FieldError field="ceo_name" />
                </div>
              </div>
              <div>
                <label htmlFor="reg-biz-reg-no" className="label">사업자등록번호 <span className="text-red-500">*</span></label>
                <input
                  id="reg-biz-reg-no" type="text" required maxLength={12}
                  value={formData.biz_reg_no}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9]/g, '');
                    const f = v.length > 5 ? `${v.slice(0,3)}-${v.slice(3,5)}-${v.slice(5)}` : v.length > 3 ? `${v.slice(0,3)}-${v.slice(3)}` : v;
                    handleChange('biz_reg_no', f);
                  }}
                  className={`input ${errors.biz_reg_no ? 'input-error' : ''}`} placeholder="123-45-67890"
                />
                <FieldError field="biz_reg_no" />
              </div>

              {/* 주소 */}
              <div>
                <label htmlFor="reg-zipcode" className="label">우편번호 <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <input
                    id="reg-zipcode" type="text" readOnly
                    value={formData.zipcode}
                    className={`input ${errors.zipcode ? 'input-error' : ''}`} placeholder="우편번호"
                  />
                  <button type="button" onClick={handleAddressSearch} className="btn-secondary whitespace-nowrap">
                    주소 찾기
                  </button>
                </div>
                <FieldError field="zipcode" />
              </div>
              <div>
                <label htmlFor="reg-road" className="label">도로명 주소 <span className="text-red-500">*</span></label>
                <input
                  id="reg-road" type="text" readOnly value={formData.road}
                  className={`input ${errors.road ? 'input-error' : ''}`} placeholder="도로명 주소"
                />
                <FieldError field="road" />
              </div>
              <div>
                <label htmlFor="reg-detail" className="label">상세 주소</label>
                <input
                  id="reg-detail" type="text" value={formData.detail}
                  onChange={(e) => handleChange('detail', e.target.value)}
                  className="input" placeholder="동/호수, 건물명 등"
                />
              </div>
              <div>
                <label htmlFor="reg-phone" className="label">연락처 <span className="text-red-500">*</span></label>
                <input
                  id="reg-phone" type="tel" required maxLength={13}
                  value={formData.phone}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9]/g, '');
                    let f = v;
                    if (v.length > 7) f = `${v.slice(0,3)}-${v.slice(3,7)}-${v.slice(7)}`;
                    else if (v.length > 3) f = `${v.slice(0,3)}-${v.slice(3)}`;
                    handleChange('phone', f);
                  }}
                  className={`input ${errors.phone ? 'input-error' : ''}`} placeholder="010-1234-5678"
                />
                <FieldError field="phone" />
              </div>
            </div>
          </div>

          <button
            id="register-submit"
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-base"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
                가입 중...
              </span>
            ) : '가입하기'}
          </button>
        </form>
      </div>
    </div>
  );
}
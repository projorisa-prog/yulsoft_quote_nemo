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
        company_address: {
          zipcode: formData.zipcode,
          road: formData.road,
          detail: formData.detail,
        },
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
    // TODO: Daum Postcode API 연동
    alert('다음 주소 API 연동 필요 (NEXT_PUBLIC_DAUM_POSTCODE_KEY 설정 필요)');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <Link href="/" className="text-xl font-bold text-primary-900">
            율소프트 견적서
          </Link>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            회원가입
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            이미 계정이 있으신가요?{' '}
            <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">
              로그인
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">이메일/비밀번호</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="label">이메일</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`input ${errors.email ? 'input-error' : ''}`}
                  placeholder="user@example.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="label">비밀번호</label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className={`input ${errors.password ? 'input-error' : ''}`}
                    placeholder="8자 이상"
                  />
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="label">비밀번호 확인</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
                    placeholder="비밀번호 재입력"
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">회사 정보</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="company_name" className="label">회사명 <span className="text-red-500">*</span></label>
                <input
                  id="company_name"
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  className={`input ${errors.company_name ? 'input-error' : ''}`}
                  placeholder="율소프트 청소"
                />
                {errors.company_name && <p className="text-red-500 text-sm mt-1">{errors.company_name}</p>}
              </div>
              <div>
                <label htmlFor="ceo_name" className="label">대표자명 <span className="text-red-500">*</span></label>
                <input
                  id="ceo_name"
                  type="text"
                  required
                  value={formData.ceo_name}
                  onChange={(e) => handleChange('ceo_name', e.target.value)}
                  className={`input ${errors.ceo_name ? 'input-error' : ''}`}
                  placeholder="홍길동"
                />
                {errors.ceo_name && <p className="text-red-500 text-sm mt-1">{errors.ceo_name}</p>}
              </div>
              <div>
                <label htmlFor="biz_reg_no" className="label">사업자등록번호 <span className="text-red-500">*</span></label>
                <input
                  id="biz_reg_no"
                  type="text"
                  required
                  maxLength={12}
                  value={formData.biz_reg_no}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    const formatted = value.length > 3 && value.length <= 5 
                      ? `${value.slice(0, 3)}-${value.slice(3)}`
                      : value.length > 5
                      ? `${value.slice(0, 3)}-${value.slice(3, 5)}-${value.slice(5)}`
                      : value;
                    handleChange('biz_reg_no', formatted);
                  }}
                  className={`input ${errors.biz_reg_no ? 'input-error' : ''}`}
                  placeholder="123-45-67890"
                />
                {errors.biz_reg_no && <p className="text-red-500 text-sm mt-1">{errors.biz_reg_no}</p>}
              </div>
              <div>
                <label htmlFor="zipcode" className="label">우편번호 <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <input
                    id="zipcode"
                    type="text"
                    required
                    readOnly
                    value={formData.zipcode}
                    className={`input ${errors.zipcode ? 'input-error' : ''}`}
                    placeholder="우편번호"
                  />
                  <button
                    type="button"
                    onClick={handleAddressSearch}
                    className="btn-secondary whitespace-nowrap"
                  >
                    주소 찾기
                  </button>
                </div>
                {errors.zipcode && <p className="text-red-500 text-sm mt-1">{errors.zipcode}</p>}
              </div>
              <div>
                <label htmlFor="road" className="label">도로명 주소 <span className="text-red-500">*</span></label>
                <input
                  id="road"
                  type="text"
                  required
                  readOnly
                  value={formData.road}
                  className={`input ${errors.road ? 'input-error' : ''}`}
                  placeholder="도로명 주소"
                />
                {errors.road && <p className="text-red-500 text-sm mt-1">{errors.road}</p>}
              </div>
              <div>
                <label htmlFor="detail" className="label">상세 주소</label>
                <input
                  id="detail"
                  type="text"
                  value={formData.detail}
                  onChange={(e) => handleChange('detail', e.target.value)}
                  className="input"
                  placeholder="동/호수, 건물명 등"
                />
              </div>
              <div>
                <label htmlFor="phone" className="label">연락처 <span className="text-red-500">*</span></label>
                <input
                  id="phone"
                  type="tel"
                  required
                  maxLength={13}
                  value={formData.phone}
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
                  className={`input ${errors.phone ? 'input-error' : ''}`}
                  placeholder="010-1234-5678"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-lg"
            >
              {loading ? '가입 중...' : '가입하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
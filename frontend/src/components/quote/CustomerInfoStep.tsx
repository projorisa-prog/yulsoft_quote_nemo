'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuoteStore } from '@/store/quoteStore';
import { BuildingType } from '@/types/quote';
import { KakaoPostcode } from '@/components/KakaoPostcode';

const COMPANY_TYPES: { value: BuildingType; label: string }[] = [
  { value: 'OFFICE', label: '사무실' },
  { value: 'HOSPITAL', label: '병원' },
  { value: 'ACADEMY', label: '학원' },
  { value: 'KINDERGARTEN', label: '유치원' },
  { value: 'STORE', label: '상가' },
  { value: 'FACTORY', label: '공장' },
  { value: 'ETC', label: '기타' },
];

export default function CustomerInfoStep() {
  const { quoteData, updateCustomer, nextStep } = useQuoteStore();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const { customer } = quoteData;

    // 상호만 필수
    if (!customer.name.trim()) newErrors.name = '상호를 입력해주세요.';

    // 연락처: 선택이지만 입력 시 형식 검증
    if (customer.phone.trim() && !/^01[0-9]-?\d{4}-?\d{4}$/.test(customer.phone)) {
      newErrors.phone = '올바른 휴대폰 번호 형식이 아닙니다.';
    }

    // 이메일: 선택이지만 입력 시 형식 검증
    if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.';
    }

    // 주소, 업체구분, 평수 모두 선택
    // 검증하지 않음

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof typeof quoteData.customer, value: string) => {
    updateCustomer({ [field]: value });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleNext = () => {
    if (validate()) {
      nextStep();
    }
  };

  const handleAddressComplete = (data: {
    zonecode: string;
    address: string;
    roadAddress: string;
    jibunAddress: string;
    buildingName: string;
  }) => {
    // 도로명 주소 우선, 없으면 지번 주소
    const fullAddress = data.roadAddress || data.jibunAddress;
    updateCustomer({ 
      address: fullAddress,
      zipcode: data.zonecode,
    });
    
    // 건물명이 있으면 상세주소에 자동 입력
    if (data.buildingName) {
      updateCustomer({ 
        detail_address: data.buildingName,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">1단계: 고객/현장 정보</h2>
        <p className="text-gray-600">견적서를 받으실 고객님 정보를 입력해주세요. (상호만 필수)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="label">상호 <span className="text-red-500">*</span></label>
          <input
            id="name"
            type="text"
            className={`input ${errors.name ? 'input-error' : ''}`}
            value={quoteData.customer.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="예: 주식회사 율소프트"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="label">연락처</label>
          <input
            id="phone"
            type="tel"
            className={`input ${errors.phone ? 'input-error' : ''}`}
            value={quoteData.customer.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="010-1234-5678 (선택)"
            maxLength={13}
          />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label htmlFor="email" className="label">이메일</label>
          <input
            id="email"
            type="email"
            className={`input ${errors.email ? 'input-error' : ''}`}
            value={quoteData.customer.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="hong@example.com (선택)"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="company_type" className="label">업체 구분</label>
          <select
            id="company_type"
            className={`input ${errors.building_type ? 'input-error' : ''}`}
            value={quoteData.customer.building_type}
            onChange={(e) => handleChange('building_type', e.target.value as BuildingType)}
          >
            <option value="">선택해주세요</option>
            {COMPANY_TYPES.map((ct) => (
              <option key={ct.value} value={ct.value}>{ct.label}</option>
            ))}
          </select>
          {errors.building_type && <p className="text-red-500 text-sm mt-1">{errors.building_type}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="address" className="label">주소</label>
        <div className="flex gap-2">
          <input
            id="address"
            type="text"
            className={`input flex-1 ${errors.address ? 'input-error' : ''}`}
            value={quoteData.customer.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="도로명 주소 (선택)"
            readOnly
          />
          <KakaoPostcode
            onComplete={(data) => {
              const fullAddress = data.roadAddress || data.jibunAddress;
              updateCustomer({ 
                address: fullAddress,
                zipcode: data.zonecode,
              });
             
              // 건물명이 있으면 상세주소에 자동 입력
              if (data.buildingName) {
                updateCustomer({ 
                  detail_address: data.buildingName,
                });
              }
            }}
            buttonText="주소 찾기"
            className="btn-secondary whitespace-nowrap"
          />
        </div>
        {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
      </div>

      <div>
        <label htmlFor="detail_address" className="label">상세 주소</label>
        <input
          id="detail_address"
          type="text"
          className="input"
          value={quoteData.customer.detail_address}
          onChange={(e) => handleChange('detail_address', e.target.value)}
          placeholder="동/호수, 건물명 등 (선택)"
        />
      </div>

      <div>
        <label htmlFor="area_pyeong" className="label">평수 (선택)</label>
        <input
          id="area_pyeong"
          type="number"
          className="input"
          value={quoteData.customer.area_pyeong || ''}
          onChange={(e) => handleChange('area_pyeong', e.target.value)}
          placeholder="예: 30"
          min="0"
          step="0.5"
        />
      </div>

      {/* 다음 버튼 */}
      <div className="pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={handleNext}
          className="btn-primary w-full md:w-auto"
          disabled={quoteData.customer.name.trim() === ''}
        >
          다음
        </button>
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useQuoteStore } from '@/store/quoteStore';
import { DesignKey } from '@/types/quote';

const DESIGNS: { key: DesignKey; label: string; description: string; preview: string }[] = [
  {
    key: 'classic',
    label: '클래식',
    description: '전통적인 견적서 스타일, 전문적인 인상',
    preview: 'bg-gradient-to-br from-gray-800 to-gray-900',
  },
  {
    key: 'modern',
    label: '모던',
    description: '애플 스타일 미니멀 디자인, 세련된 느낌',
    preview: 'bg-gradient-to-br from-gray-900 to-gray-800',
  },
  {
    key: 'color',
    label: '컬러',
    description: '브랜드 컬러 강조형, 차별화된 인상',
    preview: 'bg-gradient-to-br from-blue-900 to-indigo-900',
  },
];

export default function DesignStep({ onSubmit }: { onSubmit: (e: React.FormEvent) => void }) {
  const { quoteData, setDesignKey, updateDesign, isSubmitting } = useQuoteStore();
  const [expiresDays, setExpiresDays] = useState(quoteData.expires_days);

  const handleExpiresChange = (value: string) => {
    const num = parseInt(value) || 30;
    setExpiresDays(Math.min(Math.max(num, 1), 365));
    updateDesign({ expires_days: Math.min(Math.max(num, 1), 365) });
  };

  const handleDesignSelect = (key: DesignKey) => {
    setDesignKey(key);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">4단계: 디자인 선택</h2>
        <p className="text-gray-600">견적서 디자인을 선택하고 유효기간을 설정하세요.</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">디자인 프리셋</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DESIGNS.map((design) => (
            <button
              key={design.key}
              type="button"
              onClick={() => handleDesignSelect(design.key)}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                quoteData.design_key === design.key
                  ? 'border-primary-500 bg-primary-50 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              <div className={`${design.preview} h-32 rounded-lg mb-3 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-white/5" />
              </div>
              <h4 className="font-semibold text-gray-900">{design.label}</h4>
              <p className="text-sm text-gray-500 mt-1">{design.description}</p>
              {quoteData.design_key === design.key && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm">
                  ✓
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">견적서 유효기간</h3>
        <div className="flex items-center gap-4">
          <label htmlFor="expires_days" className="label w-32 mb-0">유효기간</label>
          <div className="flex items-center gap-2">
            <input
              id="expires_days"
              type="number"
              className="input w-24 text-center"
              value={expiresDays}
              onChange={(e) => handleExpiresChange(e.target.value)}
              min="1"
              max="365"
            />
            <span className="text-gray-600">일 (최대 365일)</span>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          유효기간 만료 후에는 견적서 조회 및 PDF 다운로드가 제한됩니다.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h4 className="font-semibold text-blue-900 mb-2">워터마크 안내</h4>
        <p className="text-sm text-blue-800">
          생성된 PDF에는 <strong>"Powered by 율소프트 | www.yulsoft.kr"</strong> 워터마크가
          하단 중앙에 자동으로 포함됩니다. 유료 전환 시 워터마크 제거가 가능합니다.
        </p>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <button
          type="submit"
          form={onSubmit.toString()}
          className="btn-accent w-full py-4 text-lg font-semibold"
          disabled={isSubmitting}
        >
          {isSubmitting ? '견적서 생성 중...' : '견적서 생성 및 PDF 다운로드'}
        </button>
        <p className="text-center text-sm text-gray-500 mt-3">
          생성이 완료되면 자동으로 완료 페이지로 이동하며 PDF가 다운로드됩니다.
        </p>
      </div>
    </div>
  );
}
'use client';

import { useQuoteStore } from '@/store/quoteStore';
import { formatNumber } from '@/lib/utils';

export default function CalculationStep() {
  const { quoteData, actions } = useQuoteStore();

  const { subtotal, discount_amount, taxable_amount, vat_amount, grand_total } = actions.getCalculatedTotals();

  const discountType = quoteData.calculation.discount_type;
  const discountValue = quoteData.calculation.discount_value;

  const handleDiscountTypeChange = (type: 'NONE' | 'PERCENT' | 'AMOUNT') => {
    actions.updateCalculation({ discount_type: type });
  };

  const handleDiscountValueChange = (value: string) => {
    const num = parseInt(value) || 0;
    actions.updateCalculation({ discount_value: num });
  };

  const handleVatIncludedChange = (checked: boolean) => {
    actions.updateCalculation({ vat_included: checked });
  };

  const handleVatRateChange = (rate: number) => {
    actions.updateCalculation({ vat_rate: rate });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">3단계: 산출 확인</h2>
        <p className="text-gray-600">자동 계산된 금액을 확인하고 할인/부가세 설정을 조정하세요.</p>
      </div>

      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">할인 설정</h3>
        <div className="space-y-4">
          <div>
            <label className="label">할인 유형</label>
            <div className="flex gap-4">
              {['NONE', 'PERCENT', 'AMOUNT'].map((type) => (
                <label
                  key={type}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-colors ${
                    discountType === type
                      ? 'border-primary-500 bg-primary-50 text-primary-900'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="discount_type"
                    value={type}
                    checked={discountType === type}
                    onChange={() => handleDiscountTypeChange(type as 'NONE' | 'PERCENT' | 'AMOUNT')}
                    className="sr-only"
                  />
                  <span className="font-medium">
                    {type === 'NONE' && '할인 없음'}
                    {type === 'PERCENT' && '비율 할인 (%)'}
                    {type === 'AMOUNT' && '금액 할인 (원)'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {discountType !== 'NONE' && (
            <div>
              <label className="label">
                할인 {discountType === 'PERCENT' ? '비율 (%)' : '금액 (원)'}
              </label>
              <input
                type="number"
                className="input"
                value={discountValue}
                onChange={(e) => handleDiscountValueChange(e.target.value)}
                min="0"
                placeholder="0"
              />
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">부가세 설정</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="vat_included"
              checked={quoteData.calculation.vat_included}
              onChange={(e) => handleVatIncludedChange(e.target.checked)}
              className="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
            />
            <label htmlFor="vat_included" className="font-medium text-gray-900">
              공급가액에 부가세 포함
            </label>
          </div>
          <div>
            <label htmlFor="vat_rate" className="label">부가세율</label>
            <select
              id="vat_rate"
              className="input"
              value={quoteData.calculation.vat_rate}
              onChange={(e) => handleVatRateChange(parseFloat(e.target.value))}
              disabled={quoteData.calculation.vat_included}
            >
              <option value={0}>0% (면세)</option>
              <option value={0.1}>10% (일반)</option>
            </select>
          </div>
        </div>
        {quoteData.calculation.vat_included && (
          <p className="text-sm text-gray-500 mt-2">※ 부가세 포함 시, 공급가액 = 합계금액 ÷ 1.1 로 역계산됩니다.</p>
        )}
      </div>

      <div className="bg-primary-900 rounded-xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">최종 금액 요약</h3>
        <table className="w-full">
          <tbody>
            <tr className="border-b border-white/20">
              <td className="py-3 text-left">공급가액 합계</td>
              <td className="py-3 text-right font-mono">{formatNumber(subtotal)} 원</td>
            </tr>
            {discount_amount > 0 && (
              <tr className="border-b border-white/20">
                <td className="py-3 text-left text-red-300">
                  할인금액 ({discountType === 'PERCENT' ? `${discountValue}%` : `${formatNumber(discountValue)}원`})
                </td>
                <td className="py-3 text-right font-mono text-red-300">- {formatNumber(discount_amount)} 원</td>
              </tr>
            )}
            <tr className="border-b border-white/20">
              <td className="py-3 text-left">과세표준</td>
              <td className="py-3 text-right font-mono">{formatNumber(taxable_amount)} 원</td>
            </tr>
            <tr className="border-b border-white/20">
              <td className="py-3 text-left">부가세 ({quoteData.calculation.vat_rate * 100}%)</td>
              <td className="py-3 text-right font-mono">{formatNumber(vat_amount)} 원</td>
            </tr>
            <tr>
              <td className="py-4 text-left text-xl font-bold">합계 금액</td>
              <td className="py-4 text-right text-xl font-bold font-mono">{formatNumber(grand_total)} 원</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-800">
          <strong>확인사항:</strong> 위 금액은 입력하신 항목 기준으로 자동 계산됩니다.
          최종 견적서 발행 전 반드시 금액을 확인해주세요.
        </p>
      </div>
    </div>
  );
}
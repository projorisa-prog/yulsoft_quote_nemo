'use client';

import { useState } from 'react';
import { useQuoteStore } from '@/store/quoteStore';
import { QuoteItemRequest, DaysOfWeek } from '@/types/quote';

const DAYS: DaysOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DAY_LABELS: Record<DaysOfWeek, string> = {
  MON: '월', TUE: '화', WED: '수', THU: '목', FRI: '금', SAT: '토', SUN: '일',
};

const PRESETS: { key: string; label: string; days: DaysOfWeek[] }[] = [
  { key: 'WEEKLY_1', label: '주 1회', days: ['MON'] },
  { key: 'WEEKLY_2', label: '주 2회', days: ['MON', 'THU'] },
  { key: 'WEEKLY_3', label: '주 3회', days: ['MON', 'WED', 'FRI'] },
  { key: 'WEEKLY_5', label: '주 5회', days: ['MON', 'TUE', 'WED', 'THU', 'FRI'] },
  { key: 'DAILY', label: '매일', days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] },
];

export default function ItemsStep() {
  const { quoteData, addItem, updateItem, removeItem, setItems, nextStep, prevStep } = useQuoteStore();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showPresets, setShowPresets] = useState(false);

  const handleAddItem = () => {
    const newItem: QuoteItemRequest = {
      area: '',
      task: '',
      days: ['MON', 'WED', 'FRI'],
      price: 0,
      exclude_area: '',
      memo: '',
    };
    addItem(newItem);
    setEditingIndex(quoteData.items.length);
  };

  const handleUpdateItem = (index: number, field: keyof QuoteItemRequest, value: string | number | DaysOfWeek[]) => {
    const updated = { ...quoteData.items[index], [field]: value };
    updateItem(index, updated);
  };

  const handleDeleteItem = (index: number) => {
    if (window.confirm('이 항목을 삭제하시겠습니까?')) {
      removeItem(index);
      if (editingIndex === index) setEditingIndex(null);
      else if (editingIndex !== null && editingIndex > index) setEditingIndex(editingIndex - 1);
    }
  };

  const handlePresetClick = (presetDays: DaysOfWeek[]) => {
    if (editingIndex !== null) {
      handleUpdateItem(editingIndex, 'days', presetDays);
    }
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    const newItems = [...quoteData.items];
    const [moved] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, moved);
    setItems(newItems.map((item, i) => ({ ...item, sort_order: i + 1 })));
  };

  const validateItems = () => {
    for (const item of quoteData.items) {
      if (!item.area.trim()) return { valid: false, message: '청소 구역을 입력해주세요.' };
      if (!item.task.trim()) return { valid: false, message: '청소 내용을 입력해주세요.' };
      if (!item.price || item.price <= 0) return { valid: false, message: '금액을 입력해주세요.' };
    }
    return { valid: true, message: '' };
  };

  const handleNext = () => {
    const validation = validateItems();
    if (!validation.valid) {
      alert(validation.message);
      return;
    }
    nextStep();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">2단계: 항목 구성</h2>
          <p className="text-gray-600">청소 구역, 내용, 금액을 입력하세요. (구역/내용/금액 필수)</p>
        </div>
        <button type="button" onClick={handleAddItem} className="btn-primary">
          + 항목 추가
        </button>
      </div>

      {quoteData.items.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
          <p className="text-gray-500 mb-4">아직 추가된 항목이 없습니다.</p>
          <button type="button" onClick={handleAddItem} className="btn-accent">
            첫 번째 항목 추가하기
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {quoteData.items.map((item, index) => (
            <div
              key={index}
              className={`border rounded-xl p-4 transition-all ${
                editingIndex === index ? 'border-primary-500 bg-primary-50 shadow-md' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-semibold text-gray-900">#{index + 1}</span>
                    {editingIndex === null && (
                      <button
                        type="button"
                        onClick={() => setEditingIndex(index)}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        수정
                      </button>
                    )}
                  </div>

                  {editingIndex === index ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="label">청소 구역 <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            className="input"
                            value={item.area}
                            onChange={(e) => handleUpdateItem(index, 'area', e.target.value)}
                            placeholder="예: 3층 병원내, 거실, 복도"
                          />
                        </div>
                        <div>
                          <label className="label">청소 내용 <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            className="input"
                            value={item.task}
                            onChange={(e) => handleUpdateItem(index, 'task', e.target.value)}
                            placeholder="예: 전체바닥 건/습식청소, 분리수거"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="label">작업 요일</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {DAYS.map((day) => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                const newDays = item.days.includes(day)
                                  ? item.days.filter((d) => d !== day)
                                  : [...item.days, day];
                                handleUpdateItem(index, 'days', newDays);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                item.days.includes(day)
                                  ? 'bg-primary-900 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {DAY_LABELS[day]}
                            </button>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {PRESETS.map((preset) => (
                            <button
                              key={preset.key}
                              type="button"
                              onClick={() => handlePresetClick(preset.days)}
                              className="px-3 py-1.5 rounded-lg text-xs bg-accent-100 text-accent-700 hover:bg-accent-200 transition-colors"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="label">비고</label>
                          <input
                            type="text"
                            className="input"
                            value={item.exclude_area}
                            onChange={(e) => handleUpdateItem(index, 'exclude_area', e.target.value)}
                            placeholder="예: 화장실 제외"
                          />
                        </div>
                        <div>
                          <label className="label">메모</label>
                          <input
                            type="text"
                            className="input"
                            value={item.memo}
                            onChange={(e) => handleUpdateItem(index, 'memo', e.target.value)}
                            placeholder="특이사항 메모"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="label">금액 (원) <span className="text-red-500">*</span></label>
                        <input
                          type="number"
                          className="input"
                          value={item.price}
                          onChange={(e) => handleUpdateItem(index, 'price', parseInt(e.target.value) || 0)}
                          min="0"
                          placeholder="예: 500000"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => setEditingIndex(null)}
                          className="btn-secondary"
                        >
                          완료
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(index)}
                          className="btn-secondary text-red-600 hover:bg-red-50"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">구역</p>
                        <p className="font-medium">{item.area || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">내용</p>
                        <p className="font-medium">{item.task || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">요일</p>
                        <p className="font-medium">{item.days.map((d) => DAY_LABELS[d]).join(', ') || '-'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-500">금액</p>
                        <p className="font-semibold text-primary-900">
                          {item.price.toLocaleString()} 원
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {editingIndex === null && (
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => index > 0 && moveItem(index, index - 1)}
                      disabled={index === 0}
                      className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      title="위로 이동"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => index < quoteData.items.length - 1 && moveItem(index, index + 1)}
                      disabled={index === quoteData.items.length - 1}
                      className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      title="아래로 이동"
                    >
                      ↓
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 하단 네비게이션 버튼 */}
      <div className="flex justify-between pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={prevStep}
          className="btn-secondary"
        >
          이전
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="btn-primary"
          disabled={quoteData.items.length === 0}
        >
          다음
        </button>
      </div>
    </div>
  );
}
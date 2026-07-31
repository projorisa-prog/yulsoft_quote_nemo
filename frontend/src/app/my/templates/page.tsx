'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatNumber, formatDateShort, UserPlan } from '@/lib/utils';
import { useQuoteStore } from '@/store/quoteStore';

interface Template {
  id: string;
  name: string;
  description: string | null;
  item_count: number;
  usage_count: number;
  created_at: string;
  updated_at: string;
  items: any[];
  calculation_snapshot: any;
}

export default function MyTemplatesPage() {
  const router = useRouter();
  const { accessToken, user, quoteData, actions } = useQuoteStore();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!accessToken) {
      router.push('/auth/login');
      return;
    }
    fetchTemplates();
  }, [accessToken, page]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/backend/my/templates?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        setTemplates(data.items);
        setTotal(data.total);
        setTotalPages(data.total_pages);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('이 템플릿을 삭제하시겠습니까?')) return;
    
    try {
      const res = await fetch(`/api/backend/my/templates/${templateId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      }
    } catch (err) {
      alert('삭제에 실패했습니다.');
    }
  };

  const handleUseTemplate = (template: any) => {
    const { setItems, updateCalculation, setCurrentStep, setTemplateId } = useQuoteStore.getState().actions;
    
    setItems(template.items);
    if (template.calculation_snapshot) {
      const store = useQuoteStore.getState();
      store.actions.updateCalculation(template.calculation_snapshot);
    }
    useQuoteStore.getState().actions.setCurrentStep(2);
    useQuoteStore.getState().actions.setTemplateId(template.id);
    
    router.push('/quote/create');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">템플릿 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const isFree = user?.plan === 'FREE';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Link href="/" className="text-xl font-bold text-primary-900">
            율소프트 견적서
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">템플릿 관리</h1>
          <p className="text-gray-600 mt-1">자주 쓰는 견적 항목을 템플릿으로 저장하고 빠르게 불러오세요.</p>
        </div>

        {isFree && (
          <div className="mb-6 p-4 rounded-xl bg-yellow-50 border border-yellow-200">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium text-yellow-800">템플릿 기능은 PRO 플랜 이상에서 이용 가능합니다.</p>
                <p className="text-sm text-yellow-700 mt-1">무료 플랜에서는 템플릿을 저장하거나 사용할 수 없습니다.</p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">저장된 템플릿</h2>
            <p className="text-sm text-gray-500 mt-1">총 {total}개 템플릿</p>
          </div>
          <Link
            href="/quote/create"
            className="btn-accent whitespace-nowrap"
          >
            + 새 견적서 작성
          </Link>
        </div>

        {templates.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">저장된 템플릿이 없습니다</h3>
            <p className="text-gray-500 mb-6">견적서 작성 시 템플릿으로 저장하면 여기서 관리할 수 있습니다.</p>
            <Link href="/quote/create" className="btn-accent inline-block">
              첫 템플릿 만들기
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">템플릿명</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">항목 수</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용 횟수</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생성일</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">수정일</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {templates.map((template) => (
                    <tr key={template.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{template.name}</div>
                        {template.description && (
                          <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{template.item_count}개</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{template.usage_count}회</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateShort(template.created_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateShort(template.updated_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleUseTemplate(template)}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                        >
                          견적 시작
                        </button>
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="text-gray-600 hover:text-red-600"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  총 {total}개 중 {(page - 1) * 10 + 1}~{Math.min(page * 10, total)}개
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="btn-secondary disabled:opacity-50"
                  >
                    이전
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="btn-secondary disabled:opacity-50"
                  >
                    다음
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
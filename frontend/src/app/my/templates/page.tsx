'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatNumber, formatDateShort } from '@/lib/utils';
import { UserPlan } from '@/types/quote';
import { useQuoteStore } from '@/store/quoteStore';
import { DashboardLayout } from '@/components/AppLayout';

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
  const { accessToken, user } = useQuoteStore();
  const { setItems, updateCalculation, setCurrentStep, setTemplateId } = useQuoteStore.getState();
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
      if (template.calculation_snapshot) {
        updateCalculation(template.calculation_snapshot);
      }
      setCurrentStep(2); // Go to items step
      setTemplateId(template.id);
    
      router.push('/quote/create');
    };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f4ff] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">템플릿 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const isFree = user?.plan === 'FREE';

  return (
    <DashboardLayout title="템플릿 관리" description="자주 쓰는 견적 항목을 템플릿으로 저장하고 빠르게 불러오세요.">

        {isFree && (
          <div className="mb-5 flex items-start gap-3 p-4 rounded-xl bg-yellow-50 border border-yellow-200">
            <svg className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-800">템플릿 기능은 PRO 플랜 이상에서 이용 가능합니다.</p>
              <p className="text-xs text-yellow-700 mt-0.5">무료 플랜에서는 템플릿을 저장하거나 사용할 수 없습니다.</p>
            </div>
          </div>
        )}

        <div className="mb-4 flex justify-between items-center">
          <p className="text-sm text-gray-400">총 {total}개 템플릿</p>
          <Link href="/quote/create" className="btn-primary text-sm px-3 py-1.5">+ 새 견적서 작성</Link>
        </div>

        {templates.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">저장된 템플릿이 없습니다</h3>
            <p className="text-sm text-gray-500 mb-5">견적서 작성 시 템플릿으로 저장하면 여기서 관리할 수 있습니다.</p>
            <Link href="/quote/create" className="btn-primary text-sm px-4 py-2">
              첫 템플릿 만들기
            </Link>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">템플릿명</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">항목 수</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">사용 횟수</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">생성일</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">수정일</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {templates.map((template) => (
                    <tr key={template.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{template.name}</div>
                        {template.description && (
                          <p className="text-xs text-gray-400 mt-0.5">{template.description}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-500">{template.item_count}개</td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-500">{template.usage_count}회</td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-500">{formatDateShort(template.created_at)}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-500">{formatDateShort(template.updated_at)}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => handleUseTemplate(template)}
                          className="text-primary-600 hover:text-primary-800 font-medium mr-3"
                        >
                          견적 시작
                        </button>
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  총 {total}개 중 {(page - 1) * 10 + 1}~{Math.min(page * 10, total)}개
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(page - 1)} disabled={page === 1} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">이전</button>
                  <span className="flex items-center px-3 text-xs text-gray-500">{page} / {totalPages}</span>
                  <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">다음</button>
                </div>
              </div>
            )}
          </div>
        )}
    </DashboardLayout>
  );
}
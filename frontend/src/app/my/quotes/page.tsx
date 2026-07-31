'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatNumber, formatDateShort } from '@/lib/utils';
import { useQuoteStore } from '@/store/quoteStore';
import { DashboardLayout } from '@/components/AppLayout';

const statusConfig: Record<string, { label: string; cls: string }> = {
  COMPLETED: { label: '완료',     cls: 'badge-green'  },
  DRAFT:     { label: '임시저장', cls: 'badge-yellow' },
  CONVERTED: { label: '계약변환', cls: 'badge-blue'   },
  EXPIRED:   { label: '만료',     cls: 'badge-red'    },
};

export default function MyQuotesPage() {
  const { accessToken } = useQuoteStore();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(), limit: '20',
        ...(statusFilter && { status: statusFilter }),
        ...(fromDate && { from: fromDate }),
        ...(toDate && { to: toDate }),
        ...(search && { search }),
      });

      const res = await fetch(`/api/backend/my/quotes?${params}`, {
        headers: { Authorization: `Bearer ${useQuoteStore.getState().accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setQuotes(data.items);
        setTotal(data.total);
        setTotalPages(data.total_pages);
      }
    } catch (err) {
      console.error('Failed to fetch quotes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuotes(); }, [page, statusFilter, fromDate, toDate, search]);

  return (
    <DashboardLayout title="내 견적서" description="작성한 견적서를 관리하고 공유하세요.">
      {/* Filters */}
      <div className="card p-4 mb-5">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div>
            <label className="label text-xs">상태</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input">
              <option value="">전체</option>
              <option value="DRAFT">임시저장</option>
              <option value="COMPLETED">완료</option>
              <option value="CONVERTED">계약변환</option>
              <option value="EXPIRED">만료</option>
            </select>
          </div>
          <div>
            <label className="label text-xs">시작일</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label text-xs">종료일</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label text-xs">검색</label>
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              className="input" placeholder="고객명, 견적번호"
            />
          </div>
          <div className="flex items-end">
            <button onClick={() => setPage(1)} className="btn-primary w-full">검색</button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : quotes.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 mb-4">작성된 견적서가 없습니다.</p>
            <Link href="/quote/create" className="btn-primary text-sm px-4 py-2">첫 견적서 만들기</Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    {['상태', '견적번호', '고객명', '금액', '디자인', '작성일', ''].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider last:text-right">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {quotes.map((q: any) => {
                    const sc = statusConfig[q.status] || { label: q.status, cls: 'badge-gray' };
                    return (
                      <tr key={q.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="px-5 py-3.5 whitespace-nowrap"><span className={sc.cls}>{sc.label}</span></td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900">{q.quote_number}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600">{q.customer_name}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm font-semibold text-gray-900">{formatNumber(q.grand_total)}원</td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-500 capitalize">{q.design_key}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-500">{formatDateShort(q.created_at)}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-right text-sm">
                          <Link href={`/my/quotes/${q.id}`} className="text-primary-600 hover:text-primary-800 font-medium mr-3">상세</Link>
                          <Link href={`/q/${q.id}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 mr-3">공유</Link>
                          <button className="text-gray-400 hover:text-gray-600">PDF</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  총 {total}개 중 {(page - 1) * 20 + 1}~{Math.min(page * 20, total)}개
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(page - 1)} disabled={page === 1} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">이전</button>
                  <span className="flex items-center px-3 text-xs text-gray-500">{page} / {totalPages}</span>
                  <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">다음</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatNumber, formatDateShort } from '@/lib/utils';
import { useQuoteStore } from '@/store/quoteStore';

interface Quote {
  id: string;
  quote_number: string;
  status: string;
  customer_name: string;
  grand_total: number;
  design_key: string;
  created_at: string;
}

export default function MyQuotesPage() {
  const router = useRouter();
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
        page: page.toString(),
        limit: '20',
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

  useEffect(() => {
    fetchQuotes();
  }, [page, statusFilter, fromDate, toDate, search]);

  const handleStatusChange = (quoteId: string, newStatus: string) => {
    // Implementation for status change if needed
  };

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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">내 견적서</h1>
          <p className="text-gray-600 mt-1">작성한 견적서를 관리하고 공유하세요.</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="label">상태</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input"
              >
                <option value="">전체</option>
                <option value="DRAFT">임시저장</option>
                <option value="COMPLETED">완료</option>
                <option value="CONVERTED">계약변환</option>
                <option value="EXPIRED">만료</option>
              </select>
            </div>
            <div>
              <label className="label">시작일</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">종료일</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">검색</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input"
                placeholder="고객명, 견적번호"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setPage(1)}
                className="btn-secondary w-full"
              >
                검색
              </button>
            </div>
          </div>
        </div>

        {/* Quotes Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          {quotes.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 mb-4">작성된 견적서가 없습니다.</p>
              <Link href="/quote/create" className="btn-accent inline-block">
                첫 견적서 만들기
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">견적번호</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">고객명</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">금액</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">디자인</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작성일</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {quotes.map((quote: any) => (
                      <tr key={quote.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            quote.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            quote.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                            quote.status === 'CONVERTED' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {quote.status === 'COMPLETED' && '완료'}
                            {quote.status === 'DRAFT' && '임시저장'}
                            {quote.status === 'CONVERTED' && '계약변환'}
                            {quote.status === 'EXPIRED' && '만료'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {quote.quote_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {quote.customer_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-right">
                          {formatNumber(quote.grand_total)} 원
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {quote.design_key}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDateShort(quote.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/my/quotes/${quote.id}`}
                            className="text-primary-600 hover:text-primary-900 mr-3"
                          >
                            상세
                          </Link>
                          <Link
                            href={`/q/${quote.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-gray-900 mr-3"
                          >
                            공유
                          </Link>
                          <button className="text-gray-600 hover:text-gray-900">
                            PDF
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
                    총 {total}개 중 {(page - 1) * 20 + 1}~{Math.min(page * 20, total)}개
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
            </>
          )}
        </div>
      </main>

      <footer className="bg-primary-950 text-primary-400 text-center text-sm py-8 mt-12">
        <p>© 2024 율소프트. All rights reserved.</p>
        <p className="mt-2">문의: www.yulsoft.kr</p>
      </footer>
    </div>
  );
}
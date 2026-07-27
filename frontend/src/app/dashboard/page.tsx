'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatNumber, formatDateShort, calculateDaysUntil } from '@/lib/utils';
import { useQuoteStore } from '@/store/quoteStore';

export default function DashboardPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated } = useQuoteStore();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      router.push('/auth/login');
      return;
    }
    fetchData();
  }, [isAuthenticated, accessToken, router]);

  const fetchData = async () => {
    try {
      const [quotesRes, subRes] = await Promise.all([
        fetch('/api/backend/my/quotes?limit=5', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch('/api/backend/payments/subscription-status', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      if (quotesRes.ok) {
        const data = await quotesRes.json();
        setQuotes(data.items || []);
      }
      if (subRes.ok) {
        setSubscription(await subRes.json());
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">대시보드 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-primary-900">
              율소프트 견적서
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">베타 무료 서비스</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            대시보드
          </h1>
          <p className="text-gray-600 mt-1">
            최근 견적서와 구독 현황을 한눈에 확인하세요.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link
            href="/quote/create"
            className="bg-primary-900 hover:bg-primary-950 text-white p-6 rounded-xl transition-colors"
          >
            <h3 className="font-semibold text-lg mb-1">새 견적서 만들기</h3>
            <p className="text-sm text-primary-200">4단계로 견적서 작성</p>
          </Link>
          <Link
            href="/my/templates"
            className="bg-white border border-gray-200 hover:border-primary-300 p-6 rounded-xl transition-colors"
          >
            <h3 className="font-semibold text-lg mb-1">템플릿 관리</h3>
            <p className="text-sm text-gray-500">저장된 템플릿으로 빠르게 작성</p>
          </Link>
          <Link
            href="/my/company"
            className="bg-white border border-gray-200 hover:border-primary-300 p-6 rounded-xl transition-colors"
          >
            <h3 className="font-semibold text-lg mb-1">회사 정보 설정</h3>
            <p className="text-sm text-gray-500">공급자 정보 자동 채우기</p>
          </Link>
          <Link
            href="/plans"
            className="bg-white border border-gray-200 hover:border-primary-300 p-6 rounded-xl transition-colors"
          >
            <h3 className="font-semibold text-lg mb-1">플랜 관리</h3>
            <p className="text-sm text-gray-500">구독 현황 확인 및 변경</p>
          </Link>
        </div>

        {/* Subscription Status */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">구독 현황</h2>
              <p className="text-sm text-gray-500 mt-1">
                현재 플랜: <span className="font-medium text-primary-900 capitalize">{subscription?.plan?.toLowerCase() || 'free'}</span>
              </p>
            </div>
            <Link
              href="/plans"
              className="btn-primary whitespace-nowrap"
            >
              플랜 변경
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: '워터마크 제거', value: subscription?.features?.watermark_removed, icon: '📄' },
              { label: '무제한 견적', value: subscription?.features?.unlimited_quotes, icon: '∞' },
              { label: '템플릿', value: subscription?.features?.templates, icon: '📋' },
              { label: '계약서 변환', value: subscription?.features?.contract_conversion, icon: '📝' },
            ].map((feature) => (
              <div key={feature.label} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <span className="text-2xl">{feature.icon}</span>
                <div>
                  <p className="font-medium text-gray-900">{feature.label}</p>
                  <p className="text-sm text-gray-500">
                    {feature.value ? '사용 가능' : '플랜 업그레이드 필요'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Quotes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">최근 견적서</h2>
              <p className="text-sm text-gray-500 mt-1">최근 5개 견적서 (전체 보기: 내 견적서)</p>
            </div>
            <Link
              href="/my/quotes"
              className="btn-secondary whitespace-nowrap"
            >
              전체 보기
            </Link>
          </div>

          {quotes.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 mb-4">작성된 견적서가 없습니다.</p>
              <Link href="/quote/create" className="btn-accent inline-block">
                첫 견적서 만들기
              </Link>
            </div>
          ) : (
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
                          className="text-gray-600 hover:text-gray-900"
                        >
                          공유
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
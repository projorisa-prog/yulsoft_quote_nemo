'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatNumber, formatDateShort } from '@/lib/utils';
import { useQuoteStore } from '@/store/quoteStore';
import { DashboardLayout } from '@/components/AppLayout';

const statusConfig: Record<string, { label: string; cls: string }> = {
  COMPLETED: { label: '완료', cls: 'badge-green' },
  DRAFT:     { label: '임시저장', cls: 'badge-yellow' },
  CONVERTED: { label: '계약변환', cls: 'badge-blue' },
  EXPIRED:   { label: '만료', cls: 'badge-red' },
};

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
        fetch('/api/backend/my/quotes?limit=5', { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch('/api/backend/payments/subscription-status', { headers: { Authorization: `Bearer ${accessToken}` } }),
      ]);
      if (quotesRes.ok) setQuotes((await quotesRes.json()).items || []);
      if (subRes.ok) setSubscription(await subRes.json());
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f4ff] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">대시보드 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const planFeatures = [
    { label: '워터마크 제거', value: subscription?.features?.watermark_removed, icon: '📄' },
    { label: '무제한 견적', value: subscription?.features?.unlimited_quotes, icon: '∞' },
    { label: '템플릿', value: subscription?.features?.templates, icon: '📋' },
    { label: '계약서 변환', value: subscription?.features?.contract_conversion, icon: '📝' },
  ];

  return (
    <DashboardLayout title="대시보드" description="최근 견적서와 구독 현황을 한눈에 확인하세요.">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { href: '/quote/create', label: '새 견적서', desc: '4단계로 작성', primary: true },
          { href: '/my/templates', label: '템플릿', desc: '빠르게 작성', primary: false },
          { href: '/my/company', label: '회사 정보', desc: '자동 채우기', primary: false },
          { href: '/plans', label: '플랜 관리', desc: '구독 확인', primary: false },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-2xl p-4 transition-all duration-200 border ${
              item.primary
                ? 'bg-primary-600 hover:bg-primary-700 text-white border-primary-700 shadow-sm'
                : 'bg-white hover:shadow-card-hover text-gray-900 border-blue-100'
            }`}
          >
            <p className={`font-semibold text-sm ${item.primary ? 'text-white' : 'text-gray-900'}`}>{item.label}</p>
            <p className={`text-xs mt-0.5 ${item.primary ? 'text-primary-200' : 'text-gray-400'}`}>{item.desc}</p>
          </Link>
        ))}
      </div>

      {/* Subscription Status */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900">구독 현황</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              현재 플랜:{' '}
              <span className="font-semibold text-primary-600 capitalize">{subscription?.plan?.toLowerCase() || 'free'}</span>
            </p>
          </div>
          <Link href="/plans" className="btn-primary text-xs px-3 py-1.5">플랜 변경</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {planFeatures.map((f) => (
            <div key={f.label} className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl">
              <span className="text-xl">{f.icon}</span>
              <div>
                <p className="text-xs font-medium text-gray-900">{f.label}</p>
                <p className={`text-xs mt-0.5 ${f.value ? 'text-accent-600' : 'text-gray-400'}`}>
                  {f.value ? '✓ 사용 가능' : '업그레이드 필요'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Quotes */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">최근 견적서</h2>
            <p className="text-xs text-gray-400 mt-0.5">최근 5개</p>
          </div>
          <Link href="/my/quotes" className="btn-secondary text-xs px-3 py-1.5">전체 보기</Link>
        </div>

        {quotes.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm mb-4">작성된 견적서가 없습니다.</p>
            <Link href="/quote/create" className="btn-primary text-sm px-4 py-2">
              첫 견적서 만들기
            </Link>
          </div>
        ) : (
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
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={sc.cls}>{sc.label}</span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900">{q.quote_number}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600">{q.customer_name}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatNumber(q.grand_total)}원
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-500 capitalize">{q.design_key}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-500">{formatDateShort(q.created_at)}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right text-sm">
                        <Link href={`/my/quotes/${q.id}`} className="text-primary-600 hover:text-primary-800 font-medium mr-3">상세</Link>
                        <Link href={`/q/${q.id}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600">공유</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
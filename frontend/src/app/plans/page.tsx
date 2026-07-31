'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuoteStore } from '@/store/quoteStore';

interface Plan {
  plan: string;
  name: string;
  price: number;
  features: string[];
}

interface SubscriptionStatus {
  plan: string;
  is_active: boolean;
  features: {
    watermark_removed: boolean;
    unlimited_quotes: boolean;
    templates: boolean;
    contract_conversion: boolean;
    api_access: boolean;
    team_members: boolean;
  };
}

export default function PlansPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, user, setAuth } = useQuoteStore();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      router.push('/auth/login');
      return;
    }
    fetchData();
  }, [isAuthenticated, accessToken, router]);

  const fetchData = async () => {
    try {
      const [plansRes, subRes] = await Promise.all([
        fetch('/api/backend/payments/plans', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch('/api/backend/payments/subscription-status', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      if (plansRes.ok) {
        const data = await plansRes.json();
        setPlans(data);
      }
      if (subRes.ok) {
        const data = await subRes.json();
        setSubscription(data);
      }
    } catch (err) {
      console.error('Failed to fetch plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: string) => {
    setSubscribing(plan);
    try {
      const res = await fetch('/api/backend/payments/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ plan, payment_method: 'CARD' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || '결제 요청에 실패했습니다.');
      }

      const data = await res.json();
      // In production, redirect to 토스페이먼츠
      // window.location.href = data.pg_redirect_url;
      alert(`결제 페이지로 이동합니다: ${data.pg_redirect_url}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : '결제 요청에 실패했습니다.');
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">플랜 정보 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const currentPlan = user?.plan || 'FREE';
  const isFree = currentPlan === 'FREE';

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
          <h1 className="text-3xl font-bold text-gray-900">플랜 선택</h1>
          <p className="text-gray-600 mt-1">
            비즈니스 규모에 맞는 플랜을 선택하세요. 언제든 변경 가능합니다.
          </p>
        </div>

        {/* Current Plan Badge */}
        <div className="mb-8 p-4 rounded-xl bg-primary-50 border border-primary-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${currentPlan === 'FREE' ? 'bg-gray-400' : currentPlan === 'PRO' ? 'bg-primary-500' : 'bg-purple-500'}`} />
              <div>
                <p className="font-semibold text-gray-900">
                  현재 플랜: <span className="text-primary-600">{currentPlan}</span>
                </p>
                <p className="text-sm text-gray-500">
                  {currentPlan === 'FREE'
                    ? '워터마크 포함, 견적 저장 5개 제한'
                    : '모든 기능 이용 가능'}
                </p>
              </div>
            </div>
            {currentPlan !== 'ENTERPRISE' && (
              <Link href="/plans" className="btn-secondary">
                플랜 업그레이드
              </Link>
            )}
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan: any) => (
            <div
              key={plan.plan}
              className={`relative rounded-2xl p-6 border-2 transition-all ${
                plan.plan === currentPlan
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300 bg-white'
              }`}
            >
              {plan.plan === currentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  현재 플랜
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price === 0 ? '무료' : `${plan.price.toLocaleString()}원`}
                  </span>
                  <span className="text-gray-500 ml-1">/월</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-600 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.plan)}
                disabled={subscribing === plan.plan || plan.plan === currentPlan}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  plan.plan === currentPlan
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-accent-500 text-white hover:bg-accent-600'
                }`}
              >
                {subscribing === plan.plan ? '처리 중...' : plan.plan === currentPlan ? '현재 플랜' : '선택하기'}
              </button>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="mt-12 overflow-x-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">기능 비교</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기능</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">FREE</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">PRO</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ENTERPRISE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  { feature: '워터마크 제거', free: false, pro: true, enterprise: true },
                  { feature: '무제한 견적 저장', free: false, pro: true, enterprise: true },
                  { feature: '템플릿 저장/관리', free: false, pro: true, enterprise: true },
                  { feature: '계약서 변환', free: false, pro: true, enterprise: true },
                  { feature: '회사 정보 자동 채우기', free: false, pro: true, enterprise: true },
                  { feature: '고객 관리 (CRM)', free: false, pro: true, enterprise: true },
                  { feature: '다중 사용자 (팀)', free: false, pro: false, enterprise: true },
                  { feature: 'API 키 발급', free: false, pro: false, enterprise: true },
                  { feature: '우선 기술 지원', free: false, pro: '이메일', enterprise: '전화 + 전담' },
                ].map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.feature}</td>
                    <td className="px-6 py-4 text-center">
                      {item.free === false ? (
                        <svg className="w-5 h-5 text-gray-300 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-primary-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {typeof item.pro === 'boolean' ? (
                        item.pro ? (
                          <svg className="w-5 h-5 text-primary-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-gray-300 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )
                      ) : (
                        <span className="text-primary-600 font-medium">{item.pro}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.enterprise === true ? (
                        <svg className="w-5 h-5 text-primary-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <span className="text-primary-600 font-medium">{item.enterprise}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">자주 묻는 질문</h2>
          <div className="space-y-4">
            {[
              {
                q: '플랜 변경은 언제든 가능한가요?',
                a: '네, 언제든 플랜을 업그레이드하거나 다운그레이드할 수 있습니다. 다운그레이드 시 다음 결제 주기부터 적용됩니다.',
              },
              {
                q: '결제는 어떻게 이루어지나요?',
                a: '토스페이먼츠를 통해 신용카드 정기결제로 진행됩니다. 매월 자동 결제되며, 결제 7일 전에 알림을 드립니다.',
              },
              {
                q: '워터마크가 제거되면 기존 견적서도 변경되나요?',
                a: '네, 유료 플랜 가입 시 기존에 발행한 모든 견적서의 워터마크가 자동으로 제거되고 PDF가 재생성됩니다.',
              },
              {
                q: '환불 정책은 어떻게 되나요?',
                a: '결제 후 7일 이내 미사용 시 전액 환불 가능합니다. 사용한 기간만큼 일할 계산 후 차감 환불됩니다.',
              },
            ].map((faq, index) => (
              <details key={index} className="bg-white rounded-xl border border-gray-200 p-4 group">
                <summary className="font-medium text-gray-900 flex items-center justify-between cursor-pointer">
                  {faq.q}
                  <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-3 text-gray-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
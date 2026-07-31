'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuoteStore } from '@/store/quoteStore';
import { AppHeader } from '@/components/AppLayout';

export default function HomePage() {
  const [isCreating, setIsCreating] = useState(false);
  const resetQuote = useQuoteStore((state) => state.reset);

  const handleStart = () => {
    resetQuote();
    setIsCreating(true);
    setTimeout(() => { window.location.href = '/quote/create'; }, 300);
  };

  const features = [
    {
      icon: (
        <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: '로그인 불필요',
      desc: '회원가입, 로그인, 이메일 인증 없이 바로 견적서 작성 시작',
    },
    {
      icon: (
        <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      title: '모바일 최적화',
      desc: '현장에서 스마트폰으로 바로 작성하고 고객에게 바로 공유',
    },
    {
      icon: (
        <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
      title: '3가지 디자인',
      desc: '클래식, 모던, 컬러 - 업체 분위기에 맞게 선택 가능',
    },
    {
      icon: (
        <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
        </svg>
      ),
      title: 'PDF 워터마크',
      desc: '자동으로 "Powered by 율소프트" 워터마크 포함된 PDF 생성',
    },
    {
      icon: (
        <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      title: '자동 계산',
      desc: '공급가액, 할인, 부가세, 합계금액 실시간 자동 산출',
    },
    {
      icon: (
        <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      ),
      title: '공유 링크',
      desc: '30일간 유효한 공개 링크로 고객에게 바로 전달 가능',
    },
  ];

  const steps = [
    { step: '1', title: '고객정보', desc: '성함, 연락처, 주소, 건물유형 입력' },
    { step: '2', title: '항목구성', desc: '청소구역, 내용, 요일, 수량, 단가 설정' },
    { step: '3', title: '산출확인', desc: '자동 계산된 공급가액, 부가세, 합계 확인' },
    { step: '4', title: '디자인선택', desc: '3가지 스타일 중 선택 후 PDF 다운로드' },
  ];

  return (
    <main className="min-h-screen bg-[#f0f4ff]">
      <AppHeader />

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary-200/30 rounded-full blur-3xl" aria-hidden="true" />
        <div className="absolute bottom-0 right-10 w-72 h-72 bg-accent-200/20 rounded-full blur-2xl" aria-hidden="true" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-100 border border-primary-200 text-sm font-semibold text-primary-700 mb-8">
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" aria-hidden="true" />
              베타 서비스 무료 제공 중 · 신용카드 불필요
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight text-gray-900 mb-5">
              로그인 없이 바로 만드는<br />
              <span className="text-primary-600">전문 청소 견적서</span>
            </h1>

            <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed">
              4단계만 거치면 완성 · 실시간 자동 계산 · PDF 즉시 다운로드 · 30일 무료 공유 링크
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
              <button
                onClick={handleStart}
                disabled={isCreating}
                id="hero-cta-primary"
                className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-all duration-200 shadow-lg shadow-primary-600/25 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 disabled:opacity-50"
              >
                {isCreating ? '준비 중...' : '무료 견적서 만들기 →'}
              </button>
              <Link
                href="/quote/create?design=modern"
                id="hero-cta-sample"
                className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 hover:border-primary-300 rounded-xl transition-all duration-200 text-center shadow-sm"
              >
                샘플 견적서 보기
              </Link>
            </div>

            {/* Design Preview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {[
                { key: 'classic', label: '클래식', desc: '전통적인 견적서 스타일', color: 'from-gray-700 to-gray-900' },
                { key: 'modern', label: '모던', desc: '애플 스타일 미니멀', color: 'from-gray-800 to-gray-700' },
                { key: 'color', label: '컬러', desc: '브랜드 컬러 강조형', color: 'from-primary-700 to-primary-900' },
              ].map((design) => (
                <Link
                  key={design.key}
                  href={`/quote/create?design=${design.key}`}
                  className="group block bg-white rounded-2xl p-4 border border-blue-100 hover:border-primary-300 hover:shadow-card-hover transition-all duration-200"
                >
                  <div className="aspect-[4/3] rounded-xl mb-3 overflow-hidden">
                    <div className={`w-full h-full bg-gradient-to-br ${design.color} flex items-end p-3`}>
                      <div className="space-y-1 w-full">
                        <div className="h-1.5 bg-white/30 rounded w-3/4" />
                        <div className="h-1.5 bg-white/20 rounded w-1/2" />
                        <div className="h-1.5 bg-white/20 rounded w-2/3" />
                      </div>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">{design.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{design.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white" id="features">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">왜 율소프트 견적서인가요?</h2>
            <p className="text-gray-500">복잡한 회원가입 없이, 청소업체 사장님이 바로 쓰실 수 있게 만들었습니다.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={i} className="card p-5 hover:shadow-card-hover transition-shadow duration-200">
                <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1.5">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-[#f0f4ff]" id="how-it-works">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">4단계로 완성하는 견적서</h2>
            <p className="text-gray-500">복잡한 설정 없이 순서대로 채우기만 하세요.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((item, i) => (
              <div key={item.step} className="card p-5 text-center relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-primary-200" aria-hidden="true" />
                )}
                <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-primary-600 text-white flex items-center justify-center text-xl font-bold shadow-sm">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">지금 바로 무료로 시작해보세요</h2>
          <p className="text-primary-200 mb-8">가입 없이, 결제 없이, 바로 전문적인 견적서를 만드실 수 있습니다.</p>
          <button
            onClick={handleStart}
            disabled={isCreating}
            id="bottom-cta"
            className="px-10 py-3.5 text-base font-semibold bg-white text-primary-700 hover:bg-primary-50 rounded-xl transition-all duration-200 shadow-lg"
          >
            {isCreating ? '준비 중...' : '무료 견적서 만들기'}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-gray-400 text-center text-sm">
        <p className="font-medium text-white mb-1">율소프트 견적서</p>
        <p>© 2024 율소프트. All rights reserved.</p>
        <p className="mt-1">
          문의:{' '}
          <a href="https://yulsoft.kr" target="_blank" rel="noopener noreferrer" className="underline hover:text-white transition-colors">
            www.yulsoft.kr
          </a>
        </p>
      </footer>
    </main>
  );
}
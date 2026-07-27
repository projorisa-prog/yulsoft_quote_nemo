'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuoteStore } from '@/store/quoteStore';

export default function HomePage() {
  const [isCreating, setIsCreating] = useState(false);
  const resetQuote = useQuoteStore((state) => state.reset);

  const handleStart = () => {
    resetQuote();
    setIsCreating(true);
    setTimeout(() => {
      window.location.href = '/quote/create';
    }, 300);
  };

  const features = [
    {
      icon: '[!]',
      title: '로그인 불필요',
      desc: '회원가입, 로그인, 이메일 인증 없이 바로 견적서 작성 시작',
    },
    {
      icon: '[D]',
      title: '모바일 최적화',
      desc: '현장에서 스마트폰으로 바로 작성하고 고객에게 바로 공유',
    },
    {
      icon: '[A]',
      title: '3가지 디자인',
      desc: '클래식, 모던, 컬러 - 업체 분위기에 맞게 선택 가능',
    },
    {
      icon: '[P]',
      title: 'PDF 워터마크',
      desc: '자동으로 "Powered by 율소프트" 워터마크 포함된 PDF 생성',
    },
    {
      icon: '[C]',
      title: '자동 계산',
      desc: '공급가액, 할인, 부가세, 합계금액 실시간 자동 산출',
    },
    {
      icon: '[L]',
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

  const designPreviews = [
    { 
      key: 'classic', 
      label: '클래식', 
      desc: '전통적인 견적서 스타일',
      gradient: 'from-gray-800 to-gray-900',
    },
    { 
      key: 'modern', 
      label: '모던', 
      desc: '애플 스타일 미니멀 디자인',
      gradient: 'from-gray-900 to-gray-800',
    },
    { 
      key: 'color', 
      label: '컬러', 
      desc: '브랜드 컬러 강조형',
      gradient: 'from-blue-900 to-indigo-900',
    },
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Global">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2" aria-label="율소프트 홈">
                <svg className="w-8 h-8 text-primary-900" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <rect width="32" height="32" rx="8" fill="currentColor"/>
                  <path d="M8 12h16M8 16h12M8 20h8" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                <span className="text-xl font-bold text-gray-900">율소프트</span>
              </Link>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/quote/create" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">견적서 만들기</Link>
              <Link href="/auth/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">로그인</Link>
              <Link href="/auth/register" className="px-4 py-2 text-sm font-semibold text-white bg-primary-900 hover:bg-primary-950 rounded-lg transition-colors">무료 시작하기</Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-50 via-white to-white" aria-hidden="true" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23000000%22%20fill-opacity%3D%220.02%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" aria-hidden="true" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-sm font-medium text-primary-700 mb-8">
              <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" aria-hidden="true" />
              베타 서비스 무료 제공 중 · 신용카드 불필요
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-gray-900 mb-6">
              로그인 없이 바로 만드는
              <br />
              <span className="text-primary-600">전문적인 청소 견적서</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl lg:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              4단계만 거치면 완성 · 실시간 자동 계산 · 워터마크 포함 PDF 즉시 다운로드 · 30일 무료 공유 링크
            </p>

            {/* Primary CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <button
                onClick={handleStart}
                disabled={isCreating}
                className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-white bg-primary-900 hover:bg-primary-950 rounded-xl transition-all duration-200 shadow-lg shadow-primary-900/25 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? '준비 중...' : '무료 견적서 만들기'}
              </button>
              <Link
                href="/quote/create?design=modern"
                className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 text-center"
              >
                샘플 견적서 보기
              </Link>
            </div>

            {/* Design Preview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {designPreviews.map((design) => (
                <Link
                  key={design.key}
                  href={"/quote/create?design=" + design.key}
                  className="group block bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 hover:border-primary-200 hover:bg-white/80 transition-all duration-300"
                >
                  <div className="aspect-[4/3] bg-gray-900/50 rounded-xl mb-4 overflow-hidden relative">
                    <div className={"absolute inset-0 " + design.gradient} aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900">{design.label}</h3>
                  <p className="text-sm text-gray-500 mt-1">{design.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              왜 율소프트 견적서인가요?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              복잡한 회원가입 없이, 청소업체 사장님이 바로 쓰실 수 있게 만들었습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div
                key={i}
                className="text-center p-6 rounded-2xl bg-white hover:bg-gray-50 hover:shadow-lg transition-all duration-300 border border-gray-100"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              4단계로 완성하는 견적서
            </h2>
            <p className="text-lg text-gray-600">복잡한 설정 없이 순서대로 채우기만 하세요.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-900 text-white flex items-center justify-center text-2xl font-bold">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-primary-900 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            지금 바로 무료로 시작해보세요
          </h2>
          <p className="text-primary-200 mb-8 text-lg">
            가입 없이, 결제 없이, 바로 전문적인 견적서를 만드실 수 있습니다.
          </p>
          <button
            onClick={handleStart}
            disabled={isCreating}
            className="px-10 py-4 text-lg font-semibold bg-accent-500 hover:bg-accent-600 text-white rounded-xl transition-all duration-200 shadow-lg shadow-accent-500/25"
          >
            {isCreating ? '준비 중...' : '무료 견적서 만들기'}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-primary-950 text-primary-400 text-center text-sm">
        <p>© 2024 율소프트. All rights reserved.</p>
        <p className="mt-2">문의: <a href="https://yulsoft.kr" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">www.yulsoft.kr</a></p>
      </footer>
    </main>
  );
}
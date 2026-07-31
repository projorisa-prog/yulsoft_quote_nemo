'use client';

import { Suspense } from 'react';

export default function CompletePageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">견적서 불러오는 중...</p>
        </div>
      </div>
    }>
      <CompletePageContent />
    </Suspense>
  );
}

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatNumber, formatDate, calculateDaysUntil } from '@/lib/utils';
import type { QuoteViewResponse } from '@/types/quote';

function CompletePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const quoteId = searchParams?.get('id');
  const [quote, setQuote] = useState<QuoteViewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!quoteId) {
      router.push('/quote/create');
      return;
    }
    async function fetchQuote() {
      try {
        const data = await api.getQuote(quoteId!);
        setQuote(data);
      } catch (error) {
        console.error('견적서 조회 실패:', error);
        router.push('/quote/create');
      } finally {
        setLoading(false);
      }
    }
    fetchQuote();
  }, [quoteId, router]);

  const handleDownload = async () => {
    if (!quote || downloading) return;
    setDownloading(true);
    try {
      const blob = await api.downloadPdf(quote.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `견적서_${quote.quote_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('PDF 다운로드 실패:', error);
      alert('PDF 다운로드에 실패했습니다.');
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/q?id=${quoteId!}`;
    navigator.clipboard.writeText(url);
    alert('링크가 클립보드에 복사되었습니다.');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">견적서를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">견적서를 찾을 수 없습니다.</p>
          <Link href="/quote/create" className="btn-primary mt-4 inline-block">
            새 견적서 만들기
          </Link>
        </div>
      </div>
    );
  }

  const daysLeft = calculateDaysUntil(quote.expires_at);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Link href="/" className="text-xl font-bold text-primary-900">
            율소프트 견적서
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            견적서 생성이 완료되었습니다
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">견적번호: {quote.quote_number}</h1>
          <p className="text-gray-600">
            유효기간: {formatDate(quote.expires_at)} ({daysLeft}일 남음)
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">주요 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">고객</p>
              <p className="font-medium">{quote.customer_info.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">연락처</p>
              <p className="font-medium">{quote.customer_info.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">총 견적금액</p>
              <p className="font-bold text-xl text-primary-900">{formatNumber(quote.totals.grand_total)} 원</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">디자인</p>
              <p className="font-medium capitalize">{quote.design_key}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">공유 및 다운로드</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="btn-accent flex-1 py-4 text-lg"
            >
              {downloading ? '다운로드 중...' : 'PDF 다운로드'}
            </button>
            <button
              onClick={handleCopyLink}
              className="btn-primary flex-1 py-4 text-lg"
            >
              링크 복사하기
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-3 text-center">
            공유 링크: <code className="bg-gray-100 px-2 py-1 rounded">{window.location.origin}/q?id={quoteId}</code>
          </p>
        </div>

        <div className="bg-primary-50 border border-primary-200 rounded-2xl p-6 text-center">
          <h3 className="font-semibold text-primary-900 mb-2">더 강력한 기능이 필요하신가요?</h3>
          <p className="text-primary-700 mb-4">
            회원가입 시 워터마크 제거, 템플릿 저장, 계약서 변환, 결제 연동 등
            다양한 프리미엄 기능을 이용하실 수 있습니다.
          </p>
          <Link href="/auth/signup" className="btn-primary inline-block">
            무료 회원가입하기
          </Link>
        </div>
      </main>

      <footer className="bg-primary-950 text-primary-400 text-center text-sm py-8 mt-12">
        <p>© 2024 율소프트. All rights reserved.</p>
        <p className="mt-2">문의: www.yulsoft.kr</p>
      </footer>
    </div>
  );
}
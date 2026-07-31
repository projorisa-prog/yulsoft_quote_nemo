'use client';

import { Suspense } from 'react';

export default function QuoteViewPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">견적서 불러오는 중...</p>
        </div>
      </div>
    }>
      <QuoteViewPageContent />
    </Suspense>
  );
}

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { formatNumber, formatDate } from '@/lib/utils';
import type { QuoteViewResponse } from '@/types/quote';
import QuotePDFView from '@/components/quote/QuotePDFView';

function QuoteViewPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams?.get('id');
  const [quote, setQuote] = useState<QuoteViewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) {
      setError(true);
      setLoading(false);
      return;
    }
    const fetchQuote = async () => {
      try {
        const data = await api.getQuote(id!);
        setQuote(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchQuote();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">견적서 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    notFound();
  }

  return <QuotePDFView quote={quote} />;
}
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { formatNumber, formatDate } from '@/lib/utils';
import type { QuoteViewResponse } from '@/types/quote';
import QuotePDFView from '@/components/quote/QuotePDFView';

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const quote = await api.getQuote(params.id);
    return {
      title: `견적서 ${quote.quote_number} | 율소프트`,
      description: `${quote.customer_info.name}님의 청소 견적서 (${formatNumber(quote.totals.grand_total)}원)`,
    };
  } catch {
    return {
      title: '견적서 조회 | 율소프트',
    };
  }
}

export default async function QuoteViewPage({ params }: PageProps) {
  try {
    const quote = await api.getQuote(params.id);
    return <QuotePDFView quote={quote} />;
  } catch {
    notFound();
  }
}
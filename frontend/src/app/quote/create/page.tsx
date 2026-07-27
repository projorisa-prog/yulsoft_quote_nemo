'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Stepper from '@/components/quote/Stepper';
import CustomerInfoStep from '@/components/quote/CustomerInfoStep';
import ItemsStep from '@/components/quote/ItemsStep';
import CalculationStep from '@/components/quote/CalculationStep';
import DesignStep from '@/components/quote/DesignStep';
import { useQuoteStore } from '@/store/quoteStore';

const STEPS = [
  { key: 1, label: '고객정보' },
  { key: 2, label: '항목구성' },
  { key: 3, label: '산출확인' },
  { key: 4, label: '디자인선택' },
];

export default function CreateQuotePage() {
  const router = useRouter();
  const { 
    currentStep, 
    quoteData, 
    isSubmitting,
    lastQuoteId,
    nextStep,
    prevStep,
    setCurrentStep,
    actions: storeActions
  } = useQuoteStore();
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (submitted && lastQuoteId) {
      router.push(`/quote/complete/${lastQuoteId}`);
    }
  }, [submitted, lastQuoteId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!quoteData.customer.name || !quoteData.customer.phone || !quoteData.customer.address) {
      alert('고객 정보를 모두 입력해주세요.');
      return;
    }

    if (quoteData.items.length === 0) {
      alert('최소 1개 이상의 항목을 추가해주세요.');
      return;
    }

    try {
      await storeActions.submitQuote();
      setSubmitted(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : '견적서 생성에 실패했습니다.');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <CustomerInfoStep />;
      case 2:
        return <ItemsStep />;
      case 3:
        return <CalculationStep />;
      case 4:
        return <DesignStep onSubmit={handleSubmit} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-primary-900">
              율소프트 견적서
            </Link>
            <div className="hidden md:flex items-center gap-4 text-sm text-gray-500">
              <span>베타 무료 서비스</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <Stepper steps={STEPS} currentStep={currentStep} />

          <div className="p-6 md:p-8">
            <form onSubmit={handleSubmit}>
              {renderStep()}
            </form>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>문의: <a href="https://yulsoft.kr" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">www.yulsoft.kr</a></p>
          <p className="mt-1">© 2024 율소프트. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
}

import Link from 'next/link';
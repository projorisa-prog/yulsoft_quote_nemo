'use client';

import { useEffect, useRef, useState } from 'react';

interface KakaoPostcodeData {
  zonecode: string;           // 우편번호 (5자리)
  address: string;            // 도로명 주소
  addressEnglish: string;     // 영문 주소
  addressType: 'R' | 'J';     // R: 도로명, J: 지번
  jibunAddress: string;       // 지번 주소
  roadAddress: string;        // 도로명 주소
  roadAddressEnglish: string; // 영문 도로명 주소
  buildingName: string;       // 건물명
  apartment: 'Y' | 'N';       // 아파트 여부
  autoJibunAddress: string;   // 자동 지번 주소
  autoRoadAddress: string;    // 자동 도로명 주소
  userSelectedType: 'R' | 'J'; // 사용자 선택 타입
  noSelected: 'Y' | 'N';      // 선택 안 함 여부
}

interface KakaoPostcodeProps {
  onComplete: (data: KakaoPostcodeData) => void;
  onClose?: () => void;
  className?: string;
  buttonText?: string;
  disabled?: boolean;
}

export function KakaoPostcode({
  onComplete,
  onClose,
  className = 'btn-secondary',
  buttonText = '주소 검색',
  disabled = false,
}: KakaoPostcodeProps) {
  const [loading, setLoading] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const scriptLoadedRef = useRef(false);

  // 카카오 우편번호 SDK 로드
  useEffect(() => {
    if (scriptLoadedRef.current || typeof window === 'undefined') return;
    
    const apiKey = process.env.NEXT_PUBLIC_KAKAO_POSTCODE_API_KEY;
    if (!apiKey) {
      console.warn('NEXT_PUBLIC_KAKAO_POSTCODE_API_KEY가 설정되지 않았습니다. 카카오 개발자 콘솔에서 JavaScript 키를 확인하세요.');
      return;
    }

    // 이미 로드된 경우
    if (window.daum?.Postcode) {
      setSdkLoaded(true);
      scriptLoadedRef.current = true;
      return;
    }

    const script = document.createElement('script');
    script.src = `https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js?apikey=${apiKey}`;
    script.async = true;
    script.onload = () => {
      setSdkLoaded(true);
      scriptLoadedRef.current = true;
    };
    script.onerror = () => {
      console.error('카카오 우편번호 SDK 로드 실패: API 키 또는 도메인 설정을 확인하세요.');
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const openPostcode = () => {
    if (!sdkLoaded || !window.daum?.Postcode) {
      alert('우편번호 서비스가 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setLoading(true);

    new window.daum.Postcode({
      oncomplete: (data: KakaoPostcodeData) => {
        setLoading(false);
        onComplete(data);
      },
      onclose: () => {
        setLoading(false);
        onClose?.();
      },
      // 옵션 설정
      theme: {
        bgColor: '#ffffff',
        searchBgColor: '#ffffff',
        contentBgColor: '#ffffff',
        pageBgColor: '#f5f5f5',
        textColor: '#333333',
        queryTextColor: '#333333',
        postcodeTextColor: '#333333',
        emphTextColor: '#0066ff',
        outlineColor: '#e0e0e0',
      },
      width: '100%',
      height: '100%',
    }).open({
      // 팝업 대신 임베드 방식으로 열기 (모바일 친화적)
      popupTitle: '우편번호 검색',
      popupKey: 'postcode',
      left: (window.screen.width - 500) / 2,
      top: (window.screen.height - 600) / 2,
    });
  };

  return (
    <button
      type="button"
      onClick={openPostcode}
      disabled={disabled || loading || !sdkLoaded}
      className={`${className} ${!sdkLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={{ minWidth: '120px' }}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          검색 중...
        </>
      ) : (
        buttonText
      )}
      {!sdkLoaded && !loading && <span className="ml-1 text-xs opacity-75">(로드 중...)</span>}
    </button>
  );
}

// 타입 선언 확장
declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: KakaoPostcodeData) => void;
        onclose?: () => void;
        theme?: Record<string, string>;
        width?: string;
        height?: string;
      }) => {
        open: (options?: { popupTitle?: string; popupKey?: string; left?: number; top?: number }) => void;
      };
    };
  }
}
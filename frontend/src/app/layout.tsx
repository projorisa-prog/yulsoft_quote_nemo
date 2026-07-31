export const metadata = {
  title: '율소프트 견적서 - 무료 견적서 만들기',
  description: '로그인 없이 바로 만드는 전문적인 청소 견적서. 애플 스타일 UI, PDF 다운로드 지원.',
  keywords: ['견적서', '청소견적', '무료견적서', 'PDF다운로드'],
};

import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
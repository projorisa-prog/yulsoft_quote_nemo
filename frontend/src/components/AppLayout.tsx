'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuoteStore } from '@/store/quoteStore';

interface NavTab {
  label: string;
  href: string;
  match: string[];
}

const navTabs: NavTab[] = [
  { label: '홈', href: '/', match: ['/'] },
  { label: '견적서 만들기', href: '/quote/create', match: ['/quote'] },
  { label: '내 견적서', href: '/my/quotes', match: ['/my/quotes'] },
  { label: 'My 서비스', href: '/dashboard', match: ['/dashboard', '/my/templates', '/my/company', '/plans'] },
];

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const mySidebarItems: SidebarItem[] = [
  {
    label: '대시보드',
    href: '/dashboard',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: '내 견적서',
    href: '/my/quotes',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: '템플릿 관리',
    href: '/my/templates',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
  },
  {
    label: '회사 정보',
    href: '/my/company',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    label: '플랜 관리',
    href: '/plans',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
];

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, logout } = useQuoteStore();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const isTabActive = (tab: NavTab) => {
    if (tab.href === '/') return pathname === '/';
    return tab.match.some((m) => pathname.startsWith(m));
  };

  return (
    <header className="bg-white border-b border-blue-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-14 gap-1">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mr-4" aria-label="율소프트 홈">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 16 16" fill="none">
                <path d="M2 5h12M2 8h9M2 11h6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-base font-bold text-gray-900">율소프트</span>
          </Link>

          {/* Tabs */}
          <nav className="flex items-end h-full gap-0.5" aria-label="메인 메뉴">
            {navTabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-all duration-150 ${
                  isTabActive(tab)
                    ? 'border-primary-600 text-primary-600 bg-primary-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>

          {/* Right: auth */}
          <div className="ml-auto flex items-center gap-2">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                로그아웃
              </button>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm text-gray-500 hover:text-primary-600 px-3 py-1.5 transition-colors">
                  로그인
                </Link>
                <Link href="/auth/register" className="btn-primary text-xs px-3 py-1.5">
                  무료 시작
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f4ff]">
      <AppHeader />
      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 py-6 gap-6">
        {/* Sidebar */}
        <aside className="w-52 flex-shrink-0">
          <div className="bg-[#e8eeff] rounded-2xl border border-blue-100 p-3 flex flex-col gap-1 sticky top-20">
            {mySidebarItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          <div className="mb-5">
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

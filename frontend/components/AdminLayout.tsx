'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale, useTranslations } from 'next-intl';
import { SvgMenu, SvgHome, SvgBoxes, SvgGrid, SvgClipboard, SvgUsers, SvgTag, SvgDocument, SvgChart, SvgCurrency } from '@/components/Svgs';

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavigationSubItem {
  name: string;
  href: string;
  type: string;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: ReactNode;
  subItems?: NavigationSubItem[];
}

const STORAGE_KEY = 'admin_navigation_state_v1';

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('admin');
  const prefUri = pathname.split('admin')[0] + 'admin';
  const router = useRouter();
  const { user, logout } = useAuth();

  // Load navigation state from session storage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setExpandedMenus(new Set(data.expandedMenus || []));
      }
    } catch (error) {
      console.warn('Failed to load navigation state from session storage:', error);
    }
  }, []);

  // Save navigation state to session storage whenever it changes
  useEffect(() => {
    try {
      const data = {
        expandedMenus: Array.from(expandedMenus),
        timestamp: Date.now(),
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save navigation state to session storage:', error);
    }
  }, [expandedMenus]);

  // Toggle menu expansion
  const toggleExpansion = (itemName: string) => {
    setExpandedMenus((prev) => {
      const next = new Set(prev);
      if (next.has(itemName)) {
        next.delete(itemName);
      } else {
        next.add(itemName);
      }
      return next;
    });
  };

  const handleLogout = async () => {
    await logout();
    router.push(`/${locale}/login`);
  };

  const navigation: NavigationItem[] = [
    {
      name: locale === 'vi' ? 'Tổng quan' : 'Dashboard',
      href: `${prefUri}`,
      icon: <SvgHome className="w-5 h-5" />,
    },
    {
      name: locale === 'vi' ? 'Sản phẩm' : 'Products',
      href: `${prefUri}/products`,
      icon: <SvgBoxes className="w-5 h-5" />,
    },
    {
      name: locale === 'vi' ? 'Danh mục' : 'Categories',
      href: `${prefUri}/categories`,
      icon: <SvgGrid className="w-5 h-5" />,
    },
    {
      name: locale === 'vi' ? 'Đơn hàng' : 'Orders',
      href: `${prefUri}/orders`,
      icon: <SvgClipboard className="w-5 h-5" />,
    },
    {
      name: locale === 'vi' ? 'Khách hàng' : 'Customers',
      href: `${prefUri}/customers`,
      icon: <SvgUsers className="w-5 h-5" />,
    },
    {
      name: locale === 'vi' ? 'Khuyến mãi' : 'Promotions',
      href: `${prefUri}/promotions`,
      icon: <SvgTag className="w-5 h-5" />,
    },
    {
      name: locale === 'vi' ? 'Nội dung' : 'Content',
      href: `${prefUri}/content`,
      icon: <SvgDocument className="w-5 h-5" />,
      subItems: [
        {
          name: t('pages'),
          href: `${prefUri}/content/pages`,
          type: 'PAGE',
        },
        {
          name: t('faqs'),
          href: `${prefUri}/content/faqs`,
          type: 'FAQ',
        },
        {
          name: t('banners'),
          href: `${prefUri}/content/banners`,
          type: 'BANNER',
        },
        {
          name: t('homepageSections'),
          href: `${prefUri}/content/homepage-sections`,
          type: 'HOMEPAGE_SECTION',
        },
      ],
    },
    {
      name: locale === 'vi' ? 'Phân tích' : 'Analytics',
      href: `${prefUri}/analytics`,
      icon: <SvgChart className="w-5 h-5" />,
    },
    {
      name: locale === 'vi' ? 'Cài đặt thanh toán' : 'Payment Settings',
      href: `${prefUri}/payment-settings`,
      icon: <SvgCurrency className="w-5 h-5" />,
    },
  ];

  // Auto-expand Content menu if current route matches any sub-item
  useEffect(() => {
    navigation.forEach((item) => {
      if (item.subItems) {
        const matchesSubItem = item.subItems.some((subItem) => {
          return pathname.startsWith(subItem.href);
        });

        if (matchesSubItem && !expandedMenus.has(item.name)) {
          setExpandedMenus((prev) => new Set(prev).add(item.name));
        }
      }
    });
  }, [pathname]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation Bar */}
      {/*<nav className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-30">*/}
      {/*  <div className="px-4 sm:px-6 lg:px-8">*/}
      {/*    <div className="flex justify-between h-16">*/}
      {/*      <div className="flex items-center">*/}
      {/*        <button*/}
      {/*          onClick={() => setIsSidebarOpen(!isSidebarOpen)}*/}
      {/*          className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"*/}
      {/*        >*/}
      {/*          <SvgMenu className="h-6 w-6" />*/}
      {/*        </button>*/}
      {/*        <h1 className="ml-4 text-xl font-semibold text-gray-900">*/}
      {/*          {locale === 'vi' ? 'Quản trị' : 'Admin Panel'}*/}
      {/*        </h1>*/}
      {/*      </div>*/}

      {/*      <div className="flex items-center space-x-4">*/}
      {/*        <Link*/}
      {/*          href={`/${locale}`}*/}
      {/*          className="text-sm text-gray-600 hover:text-gray-900"*/}
      {/*        >*/}
      {/*          {locale === 'vi' ? 'Xem cửa hàng' : 'View Store'}*/}
      {/*        </Link>*/}
      {/*        <div className="flex items-center space-x-2">*/}
      {/*          <span className="text-sm text-gray-700">*/}
      {/*            {user?.firstName} {user?.lastName}*/}
      {/*          </span>*/}
      {/*          <button*/}
      {/*            onClick={handleLogout}*/}
      {/*            className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"*/}
      {/*          >*/}
      {/*            {locale === 'vi' ? 'Đăng xuất' : 'Logout'}*/}
      {/*          </button>*/}
      {/*        </div>*/}
      {/*      </div>*/}
      {/*    </div>*/}
      {/*  </div>*/}
      {/*</nav>*/}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out z-20 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="h-full overflow-y-auto py-4" aria-label="Admin navigation">
          <ul className="space-y-1 px-3">
            {navigation.map((item) => {
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isExpanded = expandedMenus.has(item.name);

              // Check if current route matches this item or any of its sub-items
              const matchesSubItem =
                hasSubItems &&
                item.subItems!.some((subItem) => pathname.startsWith(subItem.href));

              const isActive =
                pathname === item.href ||
                (pathname.startsWith(item.href + '/') && !hasSubItems) ||
                matchesSubItem;

              return (
                <li key={item.href}>
                  {hasSubItems ? (
                    <>
                      {/* Parent item with expansion toggle */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleExpansion(item.name);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                        aria-expanded={isExpanded}
                        aria-label={`${item.name} menu`}
                      >
                        <div className="flex items-center space-x-3">
                          {item.icon}
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <svg
                          className={`w-4 h-4 transition-transform duration-200 ease-in-out ${
                            isExpanded ? 'transform rotate-90' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>

                      {/* Sub-items */}
                      {isExpanded && (
                        <ul className="mt-1 space-y-1">
                          {item.subItems!.map((subItem) => {
                            const isSubItemActive = pathname.startsWith(subItem.href);

                            return (
                              <li key={subItem.href}>
                                <Link
                                  href={subItem.href}
                                  className={`flex items-center px-3 py-2 pl-12 rounded-lg transition-colors ${
                                    isSubItemActive
                                      ? 'bg-blue-50 text-blue-700'
                                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                  }`}
                                  aria-current={isSubItemActive ? 'page' : undefined}
                                >
                                  <span className="text-sm">{subItem.name}</span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {item.icon}
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'ml-64' : 'ml-0'
        }`}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from 'next-intl';
import { SvgMenu, SvgHome, SvgBoxes, SvgGrid, SvgClipboard, SvgUsers, SvgTag, SvgDocument, SvgChart, SvgCurrency } from '@/components/Svgs';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();
  const locale = useLocale();
  const prefUri = pathname.split('admin')[0] + 'admin';
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push(`/${locale}/login`);
  };

  const navigation = [
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
        <nav className="h-full overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {item.icon}
                    <span className="font-medium">{item.name}</span>
                  </Link>
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
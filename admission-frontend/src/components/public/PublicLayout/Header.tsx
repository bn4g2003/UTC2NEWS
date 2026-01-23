'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/shared/ThemeProvider';

interface NavItem {
  label: string;
  path: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { label: 'Trang chủ', path: '/' },
  { label: 'Tra cứu kết quả', path: '/tra-cuu' },
  { label: 'Ngành tuyển sinh', path: '/nganh-tuyen-sinh' },
  { label: 'Tin tức', path: '/tin-tuc' },
  { label: 'Hướng dẫn', path: '/huong-dan' },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme, actualTheme } = useTheme();

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  const toggleTheme = () => {
    setTheme(actualTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="bg-white dark:bg-[#0A1628] text-gray-800 dark:text-white sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-24">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-4 group">
            <div className="relative w-16 h-16 transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/logo.png"
                alt="UTC2 Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="hidden lg:block border-l border-gray-200 dark:border-gray-700 pl-4">
              <div className="font-black text-xl text-[#003A8C] dark:text-white leading-tight tracking-tight">
                TRƯỜNG ĐẠI HỌC <br />
                GIAO THÔNG VẬN TẢI
              </div>
              <div className="text-[10px] text-[#D4B106] font-black tracking-[0.2em] uppercase mt-1">
                Phân hiệu tại TP. Hồ Chí Minh
              </div>
            </div>
            <div className="hidden md:block lg:hidden border-l border-gray-200 dark:border-gray-700 pl-4">
              <div className="font-bold text-lg text-[#003A8C] dark:text-white">
                UTC2 - TP.HCM
              </div>
              <div className="text-[10px] text-[#D4B106] font-bold uppercase">
                Hệ thống Tuyển sinh
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all duration-200 ${isActive(item.path)
                    ? 'text-[#003A8C] dark:text-[#E8C008] bg-[#F0F5FF] dark:bg-white/5'
                    : 'text-gray-600 dark:text-gray-300 hover:text-[#003A8C] dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
              >
                {item.label}
              </Link>
            ))}

            <div className="ml-4 pl-4 border-l border-gray-200 dark:border-gray-700 flex items-center gap-2">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                aria-label="Toggle theme"
              >
                {actualTheme === 'dark' ? (
                  <Sun size={18} className="text-[#D4B106]" />
                ) : (
                  <Moon size={18} className="text-gray-600" />
                )}
              </button>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Toggle theme"
            >
              {actualTheme === 'dark' ? (
                <Sun size={20} className="text-[#FFD700]" />
              ) : (
                <Moon size={20} className="text-white" />
              )}
            </button>
            <button
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-white/20">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`block px-4 py-3 rounded-lg mb-2 font-medium transition-all duration-300 ${isActive(item.path)
                    ? 'bg-[#FFD700] text-[#003DA5] font-bold'
                    : 'hover:bg-white/10 hover:text-[#FFD700]'
                  }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}

import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, Facebook, Youtube, Globe } from 'lucide-react';

interface FooterLink {
  label: string;
  path: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

const footerSections: FooterSection[] = [
  {
    title: 'Thông tin',
    links: [
      { label: 'Giới thiệu', path: '/gioi-thieu' },
      { label: 'Quy chế tuyển sinh', path: '/quy-che' },
      { label: 'Câu hỏi thường gặp', path: '/huong-dan' },
    ],
  },
  {
    title: 'Tuyển sinh',
    links: [
      { label: 'Ngành tuyển sinh', path: '/nganh-tuyen-sinh' },
      { label: 'Tra cứu kết quả', path: '/tra-cuu' },
      { label: 'Hướng dẫn đăng ký', path: '/huong-dan' },
    ],
  },
  {
    title: 'Tin tức',
    links: [
      { label: 'Thông báo', path: '/tin-tuc' },
      { label: 'Sự kiện', path: '/tin-tuc' },
      { label: 'Tài liệu', path: '/huong-dan' },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="bg-[#002366] dark:bg-[#050B14] text-white border-t border-white/10">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* About Section with Logo */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="relative w-14 h-14 bg-white rounded-xl p-2 shadow-inner">
                <Image
                  src="/logo.png"
                  alt="UTC2 Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="text-white font-extrabold text-xl leading-tight">
                  UTC2 <br />
                  <span className="text-[#D4B106] text-sm font-bold uppercase tracking-widest">TP. Hồ Chí Minh</span>
                </h3>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-blue-100/70 border-l-2 border-[#D4B106] pl-4 italic">
              "Kiến tạo tương lai, kết nối niềm tin" - Cổng thông tin tuyển sinh chính thức của Phân hiệu Trường Đại học Giao thông Vận tải tại TP.HCM.
            </p>
          </div>

          {/* Footer Links Sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-white font-bold text-base mb-6 uppercase tracking-wider flex items-center">
                <span className="w-1.5 h-6 bg-[#D4B106] mr-3 rounded-full"></span>
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link, index) => (
                  <li key={`${section.title}-${link.label}-${index}`}>
                    <Link
                      href={link.path}
                      className="text-sm text-blue-100/60 hover:text-[#D4B106] transition-all flex items-center group"
                    >
                      <span className="w-1 h-1 bg-white/20 rounded-full mr-2 group-hover:bg-[#D4B106] transition-colors"></span>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact Information */}
          <div>
            <h3 className="text-white font-bold text-base mb-6 uppercase tracking-wider flex items-center">
              <span className="w-1.5 h-6 bg-[#D4B106] mr-3 rounded-full"></span>
              Liên hệ
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                  <MapPin size={16} className="text-[#D4B106]" />
                </div>
                <span className="text-sm text-blue-100/60 leading-relaxed">
                  450-451 Lê Văn Việt, Phường Tăng Nhơn Phú A, TP. Thủ Đức, TP. Hồ Chí Minh
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                  <Phone size={16} className="text-[#D4B106]" />
                </div>
                <span className="text-sm text-blue-100/60 font-bold tracking-wider">
                  (028) 3896 6798
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                  <Mail size={16} className="text-[#D4B106]" />
                </div>
                <span className="text-sm text-blue-100/60 hover:text-white transition-colors cursor-pointer">
                  tuyensinh@utc2.edu.vn
                </span>
              </li>
            </ul>

            {/* Social Links */}
            <div className="mt-8 pt-8 border-t border-white/5">
              <div className="flex space-x-3">
                <a href="#" className="w-10 h-10 bg-blue-900/50 hover:bg-[#D4B106] rounded-xl flex items-center justify-center transition-all duration-300 group shadow-lg">
                  <Facebook size={18} className="text-blue-100 group-hover:text-blue-900" />
                </a>
                <a href="#" className="w-10 h-10 bg-blue-900/50 hover:bg-[#D4B106] rounded-xl flex items-center justify-center transition-all duration-300 group shadow-lg">
                  <Youtube size={18} className="text-blue-100 group-hover:text-blue-900" />
                </a>
                <a href="#" className="w-10 h-10 bg-blue-900/50 hover:bg-[#D4B106] rounded-xl flex items-center justify-center transition-all duration-300 group shadow-lg">
                  <Globe size={18} className="text-blue-100 group-hover:text-blue-900" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-[#001B4D] dark:bg-black/40 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-center md:text-left">
            <p className="text-xs text-blue-100/40 uppercase tracking-widest font-medium">
              © {new Date().getFullYear()} Trường Đại học Giao thông Vận tải Phân hiệu TP.HCM.
            </p>
            <div className="flex space-x-6">
              <Link
                href="/chinh-sach-bao-mat"
                className="text-sm text-gray-300 dark:text-gray-400 hover:text-[#FFD700] transition-colors"
              >
                Chính sách bảo mật
              </Link>
              <Link
                href="/dieu-khoan-su-dung"
                className="text-sm text-gray-300 dark:text-gray-400 hover:text-[#FFD700] transition-colors"
              >
                Điều khoản sử dụng
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { CmsService } from '@/api/services/CmsService';
import { ProgramsService } from '@/api/services/ProgramsService';
import { StudentsService } from '@/api/services/StudentsService';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  status: string;
  publishedAt?: string;
  createdAt: string;
  category?: {
    id: string;
    name: string;
  };
}

interface Statistics {
  totalPrograms: number;
  totalStudents: number;
  acceptanceRate: string;
}

export default function HomePage() {
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    totalPrograms: 0,
    totalStudents: 0,
    acceptanceRate: '0%',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHomePageData();
  }, []);

  const loadHomePageData = async () => {
    try {
      setIsLoading(true);

      // Fetch published posts
      const postsResponse = await CmsService.cmsControllerFindAllPosts('true');
      const posts = Array.isArray(postsResponse) ? postsResponse : [];
      setFeaturedPosts(posts.slice(0, 4)); // Get up to 4 for the news section

      // Fetch statistics
      try {
        const programsResponse = await ProgramsService.programControllerFindAllMajors();
        const programs = Array.isArray(programsResponse) ? programsResponse : [];

        const studentsResponse = await fetch('/api/students', {
          credentials: 'include',
        }).then((r) => (r.ok ? r.json() : []));
        const students = Array.isArray(studentsResponse) ? studentsResponse : studentsResponse.data || [];

        const acceptedStudents = students.filter((s: any) => s.status === 'accepted').length;
        const acceptanceRate = students.length > 0 ? Math.round((acceptedStudents / students.length) * 100) : 95;

        setStatistics({
          totalPrograms: programs.length || 50,
          totalStudents: students.length || 10000,
          acceptanceRate: `${acceptanceRate}%`,
        });
      } catch (statsError) {
        console.error('Error loading statistics:', statsError);
        setStatistics({
          totalPrograms: 50,
          totalStudents: 10000,
          acceptanceRate: '95%',
        });
      }
    } catch (error) {
      console.error('Error loading homepage data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-950">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/b1.jpg"
            alt="UTC2 Campus"
            fill
            className="object-cover scale-105 animate-slow-zoom"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#003A8C]/95 via-[#003A8C]/80 to-transparent"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 py-16">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white/90 text-sm font-black tracking-wider uppercase animate-fade-in-up">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4B106] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4B106]"></span>
              </span>
              Tuyển sinh năm 2026
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-white leading-[1.1] animate-fade-in-up delay-100 uppercase tracking-tighter">
              Khởi đầu <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4B106] to-[#FFE44D]">
                Sự nghiệp
              </span> <br />
              Vững chắc
            </h1>

            <p className="text-lg md:text-xl text-blue-50/80 max-w-2xl leading-relaxed animate-fade-in-up delay-200 font-medium italic">
              Chào mừng bạn đến với Cổng thông tin tuyển sinh chính thức - Phân hiệu Trường Đại học Giao thông Vận tải tại TP. Hồ Chí Minh.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 pt-4 animate-fade-in-up delay-300">
              <Link href="/tra-cuu" className="utc-button-primary text-base px-10 py-4 rounded-xl shadow-2xl shadow-blue-900/40 font-black uppercase">
                <span>Tra cứu kết quả</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              </Link>
              <Link
                href="/nganh-tuyen-sinh"
                className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-white/30 px-10 py-4 rounded-xl font-black transition-all flex items-center justify-center gap-2 uppercase"
              >
                Khám phá ngành nghề
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden md:block">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center p-1">
            <div className="w-1 h-2 bg-white rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="container mx-auto px-4 -mt-16 relative z-20 pb-12">
        <div className="utc-stats shadow-2xl shadow-blue-900/10">
          <div className="utc-stat-item border-none">
            <div className="utc-stat-value">
              {isLoading ? '...' : `${statistics.totalPrograms}+`}
            </div>
            <div className="utc-stat-label">Ngành đào tạo</div>
          </div>
          <div className="utc-stat-item">
            <div className="utc-stat-value">
              {isLoading ? '...' : `${statistics.totalStudents.toLocaleString()}+`}
            </div>
            <div className="utc-stat-label">Thí sinh đăng ký</div>
          </div>
          <div className="utc-stat-item">
            <div className="utc-stat-value">
              {isLoading ? '...' : statistics.acceptanceRate}
            </div>
            <div className="utc-stat-label">Tỷ lệ trúng tuyển</div>
          </div>
          <div className="utc-stat-item">
            <div className="text-2xl md:text-3xl font-black text-[#D4B106] mb-1">24/7</div>
            <div className="utc-stat-label">Tư vấn trực tuyến</div>
          </div>
        </div>
      </section>

      {/* Featured News Section */}
      <section className="py-20 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-4">
            <div className="max-w-2xl">
              <h2 className="utc-heading text-left font-black uppercase tracking-tight">Tin tức & Thông báo</h2>
              <p className="text-muted-foreground text-lg italic font-medium">Cập nhật những thông báo mới nhất về kỳ thi và quy chế tuyển sinh.</p>
            </div>
            {featuredPosts.length > 0 && (
              <Link href="/tin-tuc" className="utc-button-secondary mb-4 font-black uppercase text-xs tracking-widest">
                <span>Xem tất cả tin tức</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
              </Link>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 h-[500px] bg-slate-100 dark:bg-slate-900 animate-pulse rounded-[2.5rem]"></div>
              <div className="lg:col-span-5 space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-[150px] bg-slate-100 dark:bg-slate-900 animate-pulse rounded-3xl"></div>
                ))}
              </div>
            </div>
          ) : featuredPosts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-7">
                {featuredPosts[0] && (
                  <Link href={`/tin-tuc/${featuredPosts[0].slug}`} className="group block relative h-[500px] rounded-[2.5rem] overflow-hidden shadow-2xl transition-transform hover:-translate-y-2 duration-500">
                    <Image
                      src={featuredPosts[0].featuredImage || '/b1.jpg'}
                      alt={featuredPosts[0].title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-10 space-y-4">
                      <div className="utc-badge bg-[#D4B106] text-black border-none font-black text-[10px] py-1 px-3">
                        MỚI NHẤT
                      </div>
                      <h3 className="text-3xl md:text-4xl font-extrabold text-white leading-tight uppercase tracking-tight">
                        {featuredPosts[0].title}
                      </h3>
                      <p className="text-white/70 line-clamp-2 text-sm italic max-w-xl font-medium">
                        {featuredPosts[0].excerpt}
                      </p>
                      <div className="flex items-center gap-3 text-[#D4B106] font-black text-[10px] uppercase tracking-[0.2em] pt-2">
                        <span>Đọc tiếp thông tin</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
                      </div>
                    </div>
                  </Link>
                )}
              </div>

              <div className="lg:col-span-5 flex flex-col gap-6">
                {featuredPosts.slice(1, 4).map((post) => (
                  <Link key={post.id} href={`/tin-tuc/${post.slug}`} className="group flex gap-6 bg-white dark:bg-slate-900/50 p-4 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors shadow-sm hover:shadow-xl border border-gray-50 dark:border-slate-800">
                    <div className="relative w-32 h-32 rounded-2xl overflow-hidden flex-shrink-0">
                      <Image
                        src={post.featuredImage || '/b2.jpg'}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex flex-col justify-center space-y-2">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                        {formatDate(post.publishedAt || post.createdAt)}
                      </div>
                      <h4 className="font-extrabold text-gray-900 dark:text-white line-clamp-2 group-hover:text-[#003A8C] transition-colors leading-tight uppercase text-sm tracking-tight">
                        {post.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[#003A8C] dark:text-[#D4B106] font-black text-[10px] uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all">
                        Xem thêm <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
                      </div>
                    </div>
                  </Link>
                ))}

                {featuredPosts.length > 4 && (
                  <Link href="/tin-tuc" className="mt-2 text-center py-4 border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-2xl text-slate-400 font-bold text-xs uppercase tracking-widest hover:border-[#D4B106] hover:text-[#D4B106] transition-all">
                    Khám phá thêm thông báo khác
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-3xl">
              <div className="text-6xl mb-6 opacity-30">📭</div>
              <p className="text-muted-foreground font-medium italic">Hiện tại không có thông báo mới.</p>
            </div>
          )}
        </div>
      </section>

      {/* Core Services Section */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="utc-heading uppercase tracking-tight font-black">Cổng Dịch vụ Trực tuyến</h2>
            <p className="text-muted-foreground text-lg italic font-medium">
              Thực hiện các quy trình tuyển sinh một cách nhanh chóng, minh bạch và hiệu quả nhất.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link href="/tra-cuu" className="utc-card group hover:bg-[#003A8C] transition-all duration-500 rounded-[2.5rem] p-8">
              <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/10 transition-colors mx-auto">
                <span className="text-4xl group-hover:scale-110 transition-transform">🔍</span>
              </div>
              <h3 className="text-xl font-black mb-4 dark:text-white group-hover:text-white transition-colors uppercase tracking-tight">Tra cứu kết quả</h3>
              <p className="text-muted-foreground group-hover:text-white/70 transition-colors italic text-sm font-medium leading-relaxed">
                Xem kết quả xét tuyển và hướng dẫn nhập học bằng số CCCD/CMND.
              </p>
              <div className="mt-8 font-black text-[#003A8C] dark:text-[#D4B106] group-hover:text-white flex items-center justify-center gap-2 transition-colors text-[10px] uppercase tracking-[0.2em]">
                Truy cập ngay <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
              </div>
            </Link>

            <Link href="/nganh-tuyen-sinh" className="utc-card group hover:bg-[#003A8C] transition-all duration-500 rounded-[2.5rem] p-8">
              <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/10 transition-colors mx-auto">
                <span className="text-4xl group-hover:scale-110 transition-transform">📚</span>
              </div>
              <h3 className="text-xl font-black mb-4 dark:text-white group-hover:text-white transition-colors uppercase tracking-tight">Thông tin ngành nghề</h3>
              <p className="text-muted-foreground group-hover:text-white/70 transition-colors italic text-sm font-medium leading-relaxed">
                Tìm hiểu về tổ hợp môn, chỉ tiêu và các chương trình đào tạo chất lượng cao.
              </p>
              <div className="mt-8 font-black text-[#003A8C] dark:text-[#D4B106] group-hover:text-white flex items-center justify-center gap-2 transition-colors text-[10px] uppercase tracking-[0.2em]">
                Khám phá thêm <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
              </div>
            </Link>

            <Link href="/huong-dan" className="utc-card group hover:bg-[#003A8C] transition-all duration-500 rounded-[2.5rem] p-8">
              <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/10 transition-colors mx-auto">
                <span className="text-4xl group-hover:scale-110 transition-transform">📖</span>
              </div>
              <h3 className="text-xl font-black mb-4 dark:text-white group-hover:text-white transition-colors uppercase tracking-tight">Hướng dẫn đăng ký</h3>
              <p className="text-muted-foreground group-hover:text-white/70 transition-colors italic text-sm font-medium leading-relaxed">
                Quy trình từng bước để hoàn thiện hồ sơ đăng ký xét tuyển trực tuyến.
              </p>
              <div className="mt-8 font-black text-[#003A8C] dark:text-[#D4B106] group-hover:text-white flex items-center justify-center gap-2 transition-colors text-[10px] uppercase tracking-[0.2em]">
                Xem chi tiết <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-24 bg-[#003A8C]/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="utc-heading font-black uppercase tracking-tight">Cơ sở vật chất hiện đại</h2>
            <p className="text-muted-foreground text-lg italic font-medium">Khám phá môi trường học tập chuyên nghiệp tại UTC2.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[700px]">
            <div className="md:col-span-8 relative rounded-[2.5rem] overflow-hidden shadow-2xl group cursor-pointer border-4 border-white shadow-blue-900/10">
              <Image
                src="/b1.jpg"
                alt="Main Campus"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-10">
                <div className="text-white">
                  <h4 className="text-2xl font-black mb-2 uppercase tracking-tight">Khối nhà hiệu bộ</h4>
                  <p className="text-white/70 italic uppercase text-xs tracking-widest font-black">UTC2 Campus - Thủ Đức</p>
                </div>
              </div>
            </div>
            <div className="md:col-span-4 flex flex-col gap-6">
              <div className="h-1/2 relative rounded-[2.5rem] overflow-hidden shadow-2xl group cursor-pointer border-4 border-white shadow-blue-900/10">
                <Image
                  src="/b2.jpg"
                  alt="Campus View"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                  <div className="text-white">
                    <h4 className="text-xl font-black uppercase mb-1 tracking-tight">Cơ sở hạ tầng</h4>
                    <p className="text-white/70 text-[10px] italic font-black tracking-tighter uppercase">Khu vực giảng đường hiện đại</p>
                  </div>
                </div>
              </div>
              <div className="h-1/2 relative rounded-[2.5rem] overflow-hidden shadow-2xl group cursor-pointer border-4 border-white shadow-blue-900/10">
                <Image
                  src="/KTX4.jpg"
                  alt="Dormitory"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                  <div className="text-white">
                    <h4 className="text-xl font-black uppercase mb-1 tracking-tight">Ký túc xá</h4>
                    <p className="text-white/70 text-[10px] italic font-black tracking-tighter uppercase">Không gian sống tiện nghi cho sinh viên nội trú</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

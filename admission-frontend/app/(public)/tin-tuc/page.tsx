'use client';

import { useEffect, useState } from 'react';
import { CmsService } from '@/api/services/CmsService';
import { NewsCard } from '@/components/public/NewsCard/NewsCard';

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
    slug: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function NewsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const postsPerPage = 9;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Fetch published posts
      const postsResponse = await CmsService.cmsControllerFindAllPosts('true');
      const postsData = Array.isArray(postsResponse) ? postsResponse : [];
      setPosts(postsData);

      // Fetch categories
      const categoriesResponse = await CmsService.cmsControllerFindAllCategories();
      const categoriesData = Array.isArray(categoriesResponse) ? categoriesResponse : [];
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading news data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter posts by category
  const filteredPosts = selectedCategory === 'all'
    ? posts
    : posts.filter(post => post.category?.id === selectedCategory);

  // Pagination
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const currentPosts = filteredPosts.slice(startIndex, endIndex);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1); // Reset to first page when category changes
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen pb-24">
      {/* Page Header */}
      <section className="relative h-[35vh] min-h-[250px] flex items-center overflow-hidden mb-12">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#003A8C]"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-[#003A8C] to-[#002366] opacity-90"></div>
          {/* Subtle patterns */}
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center animate-fade-in-up">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 uppercase tracking-tight leading-tight">
            📰 Tin tức & Thông báo
          </h1>
          <p className="text-xl text-blue-100/70 max-w-2xl mx-auto italic font-medium">
            Cập nhật những thông tin, quy định và tin tức mới nhất về tuyển sinh tại UTC2.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4">
        {/* Category Filter */}
        <div className="mb-16 -mt-8 relative z-20">
          <div className="flex flex-wrap gap-4 justify-center bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-xl border border-gray-50 dark:border-slate-800">
            <button
              onClick={() => handleCategoryChange('all')}
              className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${selectedCategory === 'all'
                ? 'bg-[#003A8C] text-white shadow-xl shadow-blue-900/20 scale-105'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
            >
              Tất cả tin tức
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${selectedCategory === category.id
                  ? 'bg-[#003A8C] text-white shadow-xl shadow-blue-900/20 scale-105'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Posts Grid */}
        {isLoading ? (
          <div className="utc-grid py-12">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="utc-card animate-pulse border-none shadow-md">
                <div className="h-52 bg-slate-100 dark:bg-slate-800 mb-6 rounded-xl"></div>
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-24 mb-4"></div>
                <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-md w-3/4 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-full"></div>
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : currentPosts.length > 0 ? (
          <>
            <div className="flex flex-col space-y-4 max-w-5xl mx-auto py-8">
              {currentPosts.map((post) => (
                <div key={post.id} className="h-44 sm:h-52">
                  <NewsCard post={post} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-16 flex justify-center items-center gap-3 flex-wrap bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2.5rem] max-w-2xl mx-auto shadow-inner">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${currentPage === 1
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-[#003A8C] hover:bg-white dark:hover:bg-slate-800 shadow-sm'
                    }`}
                >
                  ← Trước
                </button>

                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${currentPage === page
                        ? 'bg-[#003A8C] text-white shadow-lg'
                        : 'text-slate-500 hover:bg-white dark:hover:bg-slate-800'
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${currentPage === totalPages
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-[#003A8C] hover:bg-white dark:hover:bg-slate-800 shadow-sm'
                    }`}
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="max-w-xl mx-auto py-32 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
            <div className="text-7xl mb-6 opacity-30">📭</div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">Kho dữ liệu trống</h3>
            <p className="text-muted-foreground font-medium italic">
              {selectedCategory === 'all'
                ? 'Hiện tại hệ thống chưa có thông tin thông báo mới.'
                : 'Không có tin tức nào trong danh mục lĩnh vực này.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

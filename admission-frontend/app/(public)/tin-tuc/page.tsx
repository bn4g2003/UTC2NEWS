'use client';

import { useEffect, useState, useMemo } from 'react';
import { CmsService } from '@/api/services/CmsService';
import { NewsCard } from '@/components/public/NewsCard/NewsCard';
import Fuse from 'fuse.js';
import { Search } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const postsPerPage = 9;

  // Data Fetching Effect with Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 500); // 500ms debounce for search

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Fetch Categories (Once)
      if (categories.length === 0) {
        const categoriesResponse = await CmsService.cmsControllerFindAllCategories();
        const categoriesData = Array.isArray(categoriesResponse) ? categoriesResponse : [];
        setCategories(categoriesData);
      }

      // 1. If Search Query exists -> Use Smart Vector Search API
      if (searchQuery.trim()) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/cms/posts/search?q=${encodeURIComponent(searchQuery)}&limit=20`);
        if (response.ok) {
          const searchResults = await response.json();
          setPosts(searchResults);
        }
      }
      // 2. Normal View -> Fetch all standard posts
      else {
        const postsResponse = await CmsService.cmsControllerFindAllPosts('true');
        const postsData = Array.isArray(postsResponse) ? postsResponse : [];
        setPosts(postsData);
      }

    } catch (error) {
      console.error('Error loading news data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize Fuse instance (Optional fallback/hybrid)
  const fuse = useMemo(() => {
    return new Fuse(posts, {
      keys: ['title', 'excerpt', 'content'],
      threshold: 0.3,
      distance: 100,
      includeScore: true,
    });
  }, [posts]);

  // Filter Logic
  const filteredPosts = useMemo(() => {
    let result = posts;

    // Filter by Category
    if (selectedCategory !== 'all') {
      result = result.filter(post => post.category?.id === selectedCategory);
    }

    // Note: Search filtering is now handled by API when query exists

    return result;
  }, [posts, selectedCategory]);

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
    window.scrollTo({ top: 300, behavior: 'smooth' }); // Scroll to content top
  };

  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen pb-24">
      {/* Page Header */}
      <section className="relative h-[40vh] min-h-[300px] flex items-center overflow-hidden mb-12">
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
          <p className="text-xl text-blue-100/70 max-w-2xl mx-auto italic font-medium mb-8">
            Cập nhật những thông tin, quy định và tin tức mới nhất về tuyển sinh tại UTC2.
          </p>

          {/* Smart Search Input */}
          <div className="max-w-xl mx-auto relative group">
            <div className="absolute inset-0 bg-white/20 blur-md rounded-full group-hover:bg-white/30 transition-all"></div>
            <div className="relative flex items-center bg-white dark:bg-slate-900 rounded-full px-6 py-4 shadow-2xl border-2 border-transparent focus-within:border-[#D4B106] transition-all">
              <Search className="w-6 h-6 text-slate-400 mr-3" />
              <input
                type="text"
                placeholder="Tìm kiếm thông minh (ví dụ: điểm chuẩn, quy chế...)"
                className="w-full bg-transparent border-none outline-none text-gray-800 dark:text-white placeholder:text-slate-400 font-medium"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="ml-2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4">
        {/* Category Filter */}
        <div className="mb-12 flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => handleCategoryChange('all')}
            className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 border ${selectedCategory === 'all'
              ? 'bg-[#003A8C] border-[#003A8C] text-white shadow-lg scale-105'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-[#003A8C] hover:text-[#003A8C]'
              }`}
          >
            Tất cả
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 border ${selectedCategory === category.id
                ? 'bg-[#003A8C] border-[#003A8C] text-white shadow-lg scale-105'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-[#003A8C] hover:text-[#003A8C]'
                }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Results Info */}
        {searchQuery && (
          <div className="text-center mb-8 animate-fade-in-up">
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Tìm thấy <span className="text-[#003A8C] dark:text-[#D4B106] font-bold">{filteredPosts.length}</span> kết quả cho từ khóa "{searchQuery}"
            </p>
          </div>
        )}

        {/* Posts Grid */}
        {isLoading ? (
          <div className="utc-grid py-4">
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
            <div className="flex flex-col space-y-4 max-w-5xl mx-auto mb-12">
              {currentPosts.map((post) => (
                <div key={post.id} className="h-44 sm:h-52">
                  <NewsCard post={post} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 flex-wrap bg-white dark:bg-slate-900 p-4 rounded-full shadow-lg border border-slate-100 dark:border-slate-800 w-fit mx-auto">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${currentPage === 1
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-[#003A8C] hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                  ←
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-10 h-10 rounded-full text-xs font-bold transition-all ${currentPage === page
                        ? 'bg-[#003A8C] text-white shadow-md'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${currentPage === totalPages
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-[#003A8C] hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                  →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="max-w-xl mx-auto py-24 text-center">
            <div className="text-6xl mb-6 opacity-20 filter grayscale">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Không tìm thấy kết quả</h3>
            <p className="text-slate-500">
              Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

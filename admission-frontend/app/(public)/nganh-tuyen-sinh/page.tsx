'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ProgramsService } from '@/api/services/ProgramsService';
import { ProgramCard } from '@/components/public/ProgramCard';

interface Program {
  id: string;
  name: string;
  code: string;
  description?: string;
  quota?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadPrograms();
  }, []);

  useEffect(() => {
    filterPrograms();
  }, [programs, searchQuery, selectedCategory]);

  const loadPrograms = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch active programs only for public interface
      const response = await ProgramsService.programControllerFindAllMajors('true');
      const programsData = Array.isArray(response) ? response : [];

      setPrograms(programsData);
      setFilteredPrograms(programsData);
    } catch (err) {
      console.error('Error loading programs:', err);
      setError('Không thể tải danh sách ngành tuyển sinh. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterPrograms = () => {
    let filtered = [...programs];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (program) =>
          program.name.toLowerCase().includes(query) ||
          program.code.toLowerCase().includes(query) ||
          (program.description && program.description.toLowerCase().includes(query))
      );
    }

    // Apply category filter (placeholder - can be extended based on backend support)
    if (selectedCategory !== 'all') {
      // This would filter by category if the backend provides category information
      // For now, we'll keep all programs when a category is selected
      // filtered = filtered.filter(program => program.category === selectedCategory);
    }

    setFilteredPrograms(filtered);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  // Extract unique categories (placeholder - would come from backend)
  const categories = ['all', 'Công nghệ', 'Kinh tế', 'Y tế', 'Giáo dục'];

  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen pb-24">
      {/* Page Header */}
      <section className="relative h-[40vh] min-h-[300px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/b2.jpg"
            alt="Programs Background"
            fill
            className="object-cover opacity-30 grayscale"
          />
          <div className="absolute inset-0 bg-[#003A8C]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#003A8C] via-transparent to-transparent"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center animate-fade-in-up">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 uppercase tracking-tight">
            📚 Ngành tuyển sinh
          </h1>
          <p className="text-xl text-blue-100/80 max-w-2xl mx-auto italic">
            Hệ thống đào tạo đa ngành, sẵn sàng đồng hành cùng bạn chinh phục tri thức và tương lai.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4">
        {/* Search and Filter Section */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-8 md:p-12 -mt-20 relative z-20 border border-gray-100 dark:border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-end">
            {/* Search Input */}
            <div className="space-y-3">
              <label htmlFor="search" className="text-xs font-black text-[#003A8C] dark:text-[#D4B106] uppercase tracking-widest pl-1">
                Tìm kiếm ngành nghề
              </label>
              <div className="relative group">
                <input
                  id="search"
                  type="text"
                  placeholder="Nhập tên ngành, mã ngành hoặc từ khóa..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#003A8C]/10 transition-all outline-none"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                </div>
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-3">
              <label htmlFor="category" className="text-xs font-black text-[#003A8C] dark:text-[#D4B106] uppercase tracking-widest pl-1">
                Lĩnh vực đào tạo
              </label>
              <div className="relative group">
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#003A8C]/10 transition-all outline-none appearance-none cursor-pointer"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'Tất cả các khối ngành' : category}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                </div>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mt-8 pt-6 border-t border-gray-50 dark:border-slate-800 flex items-center justify-between">
            <div className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
              Đang hiển thị <span className="text-[#003A8C] dark:text-[#D4B106] mx-1">{filteredPrograms.length}</span> ngành tuyển sinh
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-black text-[#D4B106] uppercase tracking-widest hover:underline"
              >
                Xóa tìm kiếm
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="utc-grid py-20">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="utc-card animate-pulse border-none shadow-md">
                <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-md w-24 mb-6"></div>
                <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-md w-3/4 mb-6"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-full"></div>
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="max-w-xl mx-auto py-24 text-center">
            <div className="text-6xl mb-6">⚠️</div>
            <h3 className="text-xl font-bold mb-4">Đã xảy ra lỗi hệ thống</h3>
            <p className="text-muted-foreground mb-8 italic">{error}</p>
            <button
              onClick={loadPrograms}
              className="utc-button-primary rounded-xl"
            >
              Thử tải lại trang
            </button>
          </div>
        )}

        {/* Programs Grid */}
        {!isLoading && !error && filteredPrograms.length > 0 && (
          <div className="utc-grid py-24">
            {filteredPrograms.map((program) => (
              <ProgramCard key={program.id} program={program} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredPrograms.length === 0 && (
          <div className="max-w-xl mx-auto py-32 text-center">
            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-8">
              <span className="text-4xl opacity-50">🔍</span>
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3 uppercase tracking-tight">Không tìm thấy kết quả</h3>
            <p className="text-muted-foreground mb-8">
              {searchQuery
                ? `Không có ngành nào phù hợp với từ khóa "${searchQuery}"`
                : 'Hiện tại chưa có thông tin ngành tuyển sinh mới.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="utc-button-secondary rounded-xl"
              >
                Cài lại bộ lọc
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

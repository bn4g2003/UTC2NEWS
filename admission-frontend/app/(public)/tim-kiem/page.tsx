'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchBar } from '@/components/public/SearchBar/SearchBar';
import { SearchResults } from '@/components/public/SearchResults/SearchResults';
import { CmsService } from '@/api';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (searchQuery: string) => {
    console.log('🔍 handleSearch called with:', searchQuery);
    setQuery(searchQuery);
    setLoading(true);
    setError(null);

    try {
      console.log('📡 Calling API...');
      // Sử dụng hybrid + chunk search (mặc định)
      const response = await CmsService.searchPosts(searchQuery, 10);
      
      console.log('✅ API Response received:', response);
      console.log('Response type:', typeof response);
      console.log('Is array?', Array.isArray(response));
      
      if (Array.isArray(response)) {
        response.forEach((r: any, i: number) => {
          console.log(`Result ${i + 1}:`, {
            title: r.title?.substring(0, 40),
            similarityPercent: r.similarityPercent,
            matchType: r.matchType
          });
        });
        
        // Backend đã lọc >= 50%, không cần lọc lại ở frontend
        console.log(`✅ Received ${response.length} results from backend`);
        setResults(response);
      } else {
        console.error('❌ Response is not an array:', response);
        setResults([]);
      }
    } catch (err: any) {
      console.error('❌ Search error:', err);
      setError(err.message || 'Có lỗi xảy ra khi tìm kiếm');
      setResults([]);
    } finally {
      setLoading(false);
      console.log('🏁 Search completed');
    }
  };

  // Auto search nếu có query từ URL
  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Tìm kiếm bài viết</h1>

      {/* Search bar */}
      <div className="mb-8">
        <SearchBar 
          onSearch={handleSearch} 
          loading={loading}
          placeholder="Nhập từ khóa tìm kiếm..."
        />
      </div>

      {/* Info box với adaptive threshold info */}
      {query && !loading && results.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Tìm kiếm thông minh:</strong> Hệ thống sử dụng AI để hiểu ngữ nghĩa 
            và tìm đúng đoạn văn khớp với từ khóa của bạn.
            {results[0]?._searchMeta && (
              <span className="ml-2 font-semibold">
                Độ chính xác cao nhất: {results[0]._searchMeta.topScore}% 
                (lọc kết quả ≥ {results[0]._searchMeta.threshold}%)
              </span>
            )}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">❌ {error}</p>
        </div>
      )}

      {/* Results */}
      <SearchResults 
        results={results} 
        query={query}
        loading={loading}
      />

      {/* Stats */}
      {!loading && results.length > 0 && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">📊 Thống kê kết quả:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Tổng kết quả</div>
              <div className="text-xl font-bold">{results.length}</div>
            </div>
            <div>
              <div className="text-gray-600">Khớp hoàn hảo</div>
              <div className="text-xl font-bold text-purple-600">
                {results.filter(r => r.matchType === 'hybrid').length}
              </div>
            </div>
            <div>
              <div className="text-gray-600">Khớp đoạn văn</div>
              <div className="text-xl font-bold text-blue-600">
                {results.filter(r => r.matchType === 'chunk').length}
              </div>
            </div>
            <div>
              <div className="text-gray-600">Độ chính xác TB</div>
              <div className="text-xl font-bold text-green-600">
                {Math.round(
                  results.reduce((sum, r) => sum + (r.similarityPercent || 0), 0) / results.length
                )}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  publishedAt?: string;
  similarity?: number;
  similarityPercent?: number;
  matchType?: 'vector' | 'keyword' | 'hybrid' | 'chunk';
  matchedChunk?: string;
  chunkIndex?: number;
  _searchMeta?: {
    topScore: number;
    threshold: number;
    totalBeforeFilter: number;
  };
}

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  loading?: boolean;
}

export function SearchResults({ results, query, loading }: SearchResultsProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (results.length === 0 && query) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500 mb-2">
          Không tìm thấy kết quả phù hợp cho &quot;{query}&quot;
        </p>
        <p className="text-sm text-gray-400">
          💡 Thử tìm kiếm với từ khóa khác hoặc ngắn gọn hơn
        </p>
      </Card>
    );
  }

  if (results.length === 0) {
    return null;
  }

  const getMatchTypeBadge = (matchType?: string) => {
    switch (matchType) {
      case 'hybrid':
        return <Badge className="bg-purple-500">⭐ Khớp hoàn hảo</Badge>;
      case 'chunk':
        return <Badge className="bg-blue-500">📦 Khớp đoạn văn</Badge>;
      case 'keyword':
        return <Badge className="bg-green-500">🔤 Khớp từ khóa</Badge>;
      case 'vector':
        return <Badge className="bg-orange-500">🔍 Khớp ngữ nghĩa</Badge>;
      default:
        return null;
    }
  };

  const getSimilarityColor = (percent: number) => {
    if (percent >= 80) return 'text-green-600 font-bold';
    if (percent >= 60) return 'text-blue-600 font-semibold';
    if (percent >= 40) return 'text-orange-600';
    return 'text-gray-500'; // Không hiển thị nếu < 40%
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        Tìm thấy {results.length} kết quả phù hợp cho &quot;{query}&quot;
        {results[0]?._searchMeta && (
          <div className="mt-2 text-xs bg-gray-100 p-2 rounded">
            📊 <strong>Chất lượng tìm kiếm:</strong> Kết quả tốt nhất {results[0]._searchMeta.topScore}% 
            → Hiển thị kết quả ≥ {results[0]._searchMeta.threshold}% 
            (đã lọc {results[0]._searchMeta.totalBeforeFilter - results.length} kết quả kém)
          </div>
        )}
      </div>

      {results.map((result, index) => {
        const similarityPercent = result.similarityPercent || 0;
        
        return (
          <Card key={result.id} className="p-6 hover:shadow-lg transition-shadow">
            {/* Header với rank và similarity */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-300">
                  #{index + 1}
                </span>
                <div>
                  <Link 
                    href={`/tin-tuc/${result.slug}`}
                    className="text-xl font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {result.title}
                  </Link>
                </div>
              </div>
              
              {/* Similarity score */}
              <div className="flex flex-col items-end gap-2">
                <div className={`text-lg ${getSimilarityColor(similarityPercent)}`}>
                  {similarityPercent}% khớp
                </div>
                {getMatchTypeBadge(result.matchType)}
              </div>
            </div>

            {/* Excerpt hoặc matched chunk */}
            <div className="text-gray-700 mb-3">
              {result.matchedChunk ? (
                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    📍 Đoạn văn khớp (chunk #{result.chunkIndex}):
                  </p>
                  <p className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                    &quot;{result.matchedChunk.substring(0, 200)}...&quot;
                  </p>
                </div>
              ) : result.excerpt ? (
                <p>{result.excerpt}</p>
              ) : (
                <p>{result.content.substring(0, 200)}...</p>
              )}
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {result.publishedAt && (
                <span>
                  📅 {new Date(result.publishedAt).toLocaleDateString('vi-VN')}
                </span>
              )}
              <Link 
                href={`/tin-tuc/${result.slug}`}
                className="text-blue-600 hover:underline"
              >
                Đọc thêm →
              </Link>
            </div>

            {/* Similarity bar */}
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    similarityPercent >= 80 ? 'bg-green-500' :
                    similarityPercent >= 60 ? 'bg-blue-500' :
                    similarityPercent >= 40 ? 'bg-orange-500' :
                    'bg-gray-400'
                  }`}
                  style={{ width: `${similarityPercent}%` }}
                ></div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

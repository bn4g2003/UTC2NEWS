'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProgramsService } from '@/api/services/ProgramsService';

interface ProgramDetail {
  id: string;
  name: string;
  code: string;
  description?: string;
  quota?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.id as string;

  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (programId) {
      loadProgramDetail();
    }
  }, [programId]);

  const loadProgramDetail = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await ProgramsService.programControllerFindMajorById(programId);
      setProgram(response);
    } catch (err: any) {
      console.error('Error loading program detail:', err);
      
      if (err.status === 404) {
        setError('Không tìm thấy ngành tuyển sinh này.');
      } else {
        setError('Không thể tải thông tin ngành tuyển sinh. Vui lòng thử lại sau.');
      }
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
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="gov-portal-container py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-[#0052CC]">
              Trang chủ
            </Link>
            <span className="text-gray-400">/</span>
            <Link
              href="/nganh-tuyen-sinh"
              className="text-gray-500 hover:text-[#0052CC]"
            >
              Ngành tuyển sinh
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">
              {isLoading ? 'Đang tải...' : program?.name || 'Chi tiết'}
            </span>
          </nav>
        </div>
      </div>

      <div className="gov-portal-container">
        {/* Loading State */}
        {isLoading && (
          <div className="bg-white border-2 border-gray-200 p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-32 mb-4"></div>
              <div className="h-12 bg-gray-300 rounded w-3/4 mb-6"></div>
              <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-5/6 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-4/6 mb-6"></div>
              <div className="h-6 bg-gray-300 rounded w-48"></div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 border-2 border-red-200 p-8 text-center">
            <p className="text-red-600 font-semibold text-lg mb-2">Lỗi</p>
            <p className="text-red-700 mb-4">{error}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={loadProgramDetail}
                className="gov-portal-button-primary"
              >
                Thử lại
              </button>
              <Link
                href="/nganh-tuyen-sinh"
                className="gov-portal-button-secondary"
              >
                Quay lại danh sách
              </Link>
            </div>
          </div>
        )}

        {/* Program Detail */}
        {program && !isLoading && !error && (
          <div className="bg-white border-2 border-gray-200 p-8">
            {/* Program Code Badge */}
            <div className="inline-block bg-blue-100 text-[#0052CC] px-4 py-2 text-sm font-semibold mb-4">
              Mã ngành: {program.code}
            </div>

            {/* Program Name */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              {program.name}
            </h1>

            {/* Program Status */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Trạng thái:</span>
                <span
                  className={`px-3 py-1 text-sm font-semibold ${
                    program.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {program.isActive ? 'Đang tuyển sinh' : 'Không hoạt động'}
                </span>
              </div>
            </div>

            {/* Program Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Quota Information */}
              <div className="bg-blue-50 border-l-4 border-[#0052CC] p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Chỉ tiêu tuyển sinh
                </h3>
                {program.quota !== undefined && program.quota !== null ? (
                  <p className="text-3xl font-bold text-[#0052CC]">
                    {program.quota} sinh viên
                  </p>
                ) : (
                  <p className="text-gray-600">Chưa công bố</p>
                )}
              </div>

              {/* Additional Info */}
              <div className="bg-gray-50 border-l-4 border-gray-400 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Thông tin cập nhật
                </h3>
                <p className="text-sm text-gray-600">
                  Cập nhật lần cuối: {formatDate(program.updatedAt)}
                </p>
              </div>
            </div>

            {/* Program Description */}
            {program.description && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Mô tả ngành học
                </h2>
                <div className="prose max-w-none text-gray-700">
                  <p className="whitespace-pre-wrap">{program.description}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <Link
                href="/nganh-tuyen-sinh"
                className="gov-portal-button-secondary text-center"
              >
                ← Quay lại danh sách
              </Link>
              <Link
                href="/tra-cuu"
                className="gov-portal-button-primary text-center"
              >
                Tra cứu kết quả tuyển sinh
              </Link>
            </div>
          </div>
        )}

        {/* Related Information Section */}
        {program && !isLoading && !error && (
          <div className="mt-8 bg-white border-2 border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Thông tin liên quan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/huong-dan"
                className="flex items-center gap-3 p-4 border-2 border-gray-200 hover:border-[#0052CC] transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Hướng dẫn đăng ký
                  </h3>
                  <p className="text-sm text-gray-600">
                    Xem hướng dẫn chi tiết về quy trình đăng ký tuyển sinh
                  </p>
                </div>
                <span className="text-[#0052CC]">→</span>
              </Link>

              <Link
                href="/tin-tuc"
                className="flex items-center gap-3 p-4 border-2 border-gray-200 hover:border-[#0052CC] transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Tin tức tuyển sinh
                  </h3>
                  <p className="text-sm text-gray-600">
                    Cập nhật thông tin và tin tức mới nhất về tuyển sinh
                  </p>
                </div>
                <span className="text-[#0052CC]">→</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

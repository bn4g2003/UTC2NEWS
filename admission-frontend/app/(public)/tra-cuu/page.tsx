'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { resultLookupSchema, type ResultLookupFormData } from '@/lib/validation';
import { lookupResult, type AdmissionResult } from '@/lib/result-lookup';

export default function ResultLookupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AdmissionResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ResultLookupFormData>({
    resolver: zodResolver(resultLookupSchema),
    defaultValues: {
      idCardNumber: '',
    },
  });

  const handleSubmit = async (data: ResultLookupFormData) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setNotFound(false);

    try {
      const admissionResult = await lookupResult(data.idCardNumber);

      if (admissionResult) {
        setResult(admissionResult);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      console.error('Error looking up result:', err);
      setError('Có lỗi xảy ra khi tra cứu kết quả. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen pb-24">
      {/* Page Header */}
      <section className="relative h-[35vh] min-h-[250px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#003A8C]"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-[#003A8C] to-[#002366] opacity-90"></div>
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 uppercase tracking-tight leading-tight">
            🔍 Tra cứu kết quả xét tuyển
          </h1>
          <p className="text-lg text-blue-100/70 max-w-2xl mx-auto italic">
            Hệ thống tra cứu chính xác, bảo mật và nhanh chóng dành cho thí sinh.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 -mt-16 relative z-20">
        <div className="max-w-4xl mx-auto">
          {/* Search Form Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-8 md:p-12 border border-gray-100 dark:border-slate-800 mb-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="hidden md:flex w-24 h-24 rounded-3xl bg-blue-50 dark:bg-slate-800 items-center justify-center flex-shrink-0">
                <Search size={40} className="text-[#003A8C] dark:text-[#D4B106]" />
              </div>
              <div className="flex-1 space-y-6 w-full">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">Thông tin định danh</h2>
                  <p className="text-muted-foreground text-sm italic">Vui lòng nhập chính xác số CCCD/CMND đã đăng ký trên hệ thống.</p>
                </div>

                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  <div className="space-y-3">
                    <label htmlFor="idCardNumber" className="text-[10px] font-black text-[#003A8C] dark:text-[#D4B106] uppercase tracking-[0.2em] pl-1">
                      Số CMND / Căn cước công dân
                    </label>
                    <div className="relative group">
                      <input
                        id="idCardNumber"
                        type="text"
                        placeholder="Ví dụ: 079123456789"
                        {...form.register('idCardNumber')}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-5 text-xl font-bold tracking-widest text-[#003A8C] dark:text-white focus:ring-4 focus:ring-[#003A8C]/10 transition-all outline-none"
                        disabled={isLoading}
                      />
                      {form.formState.errors.idCardNumber && (
                        <p className="mt-2 text-xs font-bold text-red-500 uppercase tracking-tighter italic">
                          {form.formState.errors.idCardNumber.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-xl">
                      <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="utc-button-primary w-full py-5 rounded-2xl text-lg shadow-xl shadow-blue-900/20 disabled:grayscale transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                        Đang truy vấn dữ liệu...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-6 w-6" />
                        Tìm kiếm kết quả hồ sơ
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Result Display - Not Found */}
          {notFound && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl p-10 border-l-8 border-orange-400 animate-fade-in-up">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                  <AlertCircle className="h-10 w-10 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4">
                    Thông tin không tồn tại
                  </h3>
                  <p className="text-muted-foreground text-lg mb-8 italic">
                    Hệ thống không tìm thấy hồ sơ tuyển sinh ứng với số định danh này.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                      <span className="block text-[#D4B106] font-black text-xs uppercase mb-2">Bước 1</span>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Kiểm tra lại số CCCD đã nhập</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                      <span className="block text-[#D4B106] font-black text-xs uppercase mb-2">Bước 2</span>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Xác nhận hồ sơ đã được nộp</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                      <span className="block text-[#D4B106] font-black text-xs uppercase mb-2">Bước 3</span>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Liên hệ hỗ trợ: (028) 3896 6798</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Result Display - Found */}
          {result && (
            <div className="space-y-8 animate-fade-in-up">
              {/* Status Banner */}
              <div className={`rounded-[2.5rem] p-10 shadow-2xl overflow-hidden relative border-none ${result.status === 'accepted'
                  ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white'
                  : result.status === 'rejected'
                    ? 'bg-gradient-to-br from-rose-600 to-red-700 text-white'
                    : 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
                }`}>
                {/* Abstract pattern overlay */}
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 animate-bounce">
                    {result.status === 'accepted' ? (
                      <CheckCircle2 className="h-12 w-12 text-white" />
                    ) : result.status === 'rejected' ? (
                      <XCircle className="h-12 w-12 text-white" />
                    ) : (
                      <AlertCircle className="h-12 w-12 text-white" />
                    )}
                  </div>
                  <div className="text-center md:text-left">
                    <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-2">
                      {result.status === 'accepted' && 'Chúc mừng trúng tuyển!'}
                      {result.status === 'rejected' && 'Chưa đạt điều kiện'}
                      {result.status === 'pending' && 'Đang được xét duyệt'}
                    </h3>
                    <p className="text-white/80 text-lg font-medium italic">
                      {result.status === 'accepted' && 'Hệ thống đã xác nhận bạn đạt đủ điều kiện nhập học vào ngành đào tạo.'}
                      {result.status === 'rejected' && 'Rất tiếc, điểm số của bạn chưa đạt ngưỡng trúng tuyển trong đợt này.'}
                      {result.status === 'pending' && 'Hồ sơ đang trong quy trình đánh giá, vui lòng kiểm tra lại sau.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Student Information */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl p-8 border border-gray-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 mb-8 border-b border-gray-50 dark:border-slate-800 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-slate-800 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#003A8C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    </div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Thí sinh</h3>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-end border-b border-dashed border-gray-100 dark:border-slate-800 pb-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Họ và tên</span>
                      <span className="font-extrabold text-[#003A8C] dark:text-white uppercase">{result.student.fullName}</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-dashed border-gray-100 dark:border-slate-800 pb-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Số CCCD</span>
                      <span className="font-extrabold text-[#003A8C] dark:text-white">{result.student.idCardNumber}</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-dashed border-gray-100 dark:border-slate-800 pb-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ngày sinh</span>
                      <span className="font-extrabold text-[#003A8C] dark:text-white">{new Date(result.student.dateOfBirth).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-dashed border-gray-100 dark:border-slate-800 pb-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Đợt tuyển</span>
                      <span className="font-extrabold text-[#003A8C] dark:text-white uppercase">{result.session.name}</span>
                    </div>
                  </div>
                </div>

                {/* Academic Result */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl p-8 border border-gray-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 mb-8 border-b border-gray-50 dark:border-slate-800 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-slate-800 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#003A8C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" /><path d="M6.5 2H20v20H6.5" /><path d="M8 7h6" /><path d="M8 11h8" /></svg>
                    </div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Chuyên ngành</h3>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-start border-b border-dashed border-gray-100 dark:border-slate-800 pb-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Ngành xét tuyển</span>
                      <span className="font-extrabold text-[#003A8C] dark:text-white text-right max-w-[200px] uppercase leading-tight">{result.program.name}</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-dashed border-gray-100 dark:border-slate-800 pb-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mã ngành</span>
                      <span className="font-extrabold text-[#003A8C] dark:text-white">{result.program.code}</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-dashed border-gray-100 dark:border-slate-800 pb-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tổng điểm</span>
                      <span className="text-3xl font-black text-[#D4B106]">{result.score.toFixed(2)}</span>
                    </div>
                    {result.ranking && (
                      <div className="flex justify-between items-end border-b border-dashed border-gray-100 dark:border-slate-800 pb-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Xếp hạng</span>
                        <span className="font-black text-emerald-500 text-xl italic">Thứ {result.ranking}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Next Steps for Accepted Students */}
              {result.status === 'accepted' && (
                <div className="bg-[#003A8C]/5 rounded-[2.5rem] p-10 border-2 border-dashed border-[#003A8C]/20">
                  <h4 className="text-xl font-black text-[#003A8C] uppercase tracking-tight mb-8 text-center flex items-center justify-center gap-3">
                    <div className="h-0.5 w-12 bg-[#003A8C]/20 rounded-full"></div>
                    Lộ trình nhập học bắt buộc
                    <div className="h-0.5 w-12 bg-[#003A8C]/20 rounded-full"></div>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm space-y-3">
                      <span className="w-8 h-8 rounded-full bg-[#003A8C] text-white flex items-center justify-center font-black text-sm">1</span>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Chuẩn bị hồ sơ gốc để đối chiếu và nộp bản photo công chứng</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm space-y-3">
                      <span className="w-8 h-8 rounded-full bg-[#003A8C] text-white flex items-center justify-center font-black text-sm">2</span>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Nộp hồ sơ trực tiếp hoặc gửi đảm bảo qua bưu điện về trường</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm space-y-3">
                      <span className="w-8 h-8 rounded-full bg-[#003A8C] text-white flex items-center justify-center font-black text-sm">3</span>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Hoàn tất học phí kỳ 1 theo quy định trong giấy báo nhập học</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm space-y-3">
                      <span className="w-8 h-8 rounded-full bg-[#003A8C] text-white flex items-center justify-center font-black text-sm">4</span>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Nhận lịch sinh hoạt công dân và lịch học chính thức từ VP đoàn</p>
                    </div>
                  </div>

                  <div className="mt-8 text-center">
                    <p className="text-xs font-black text-red-500 uppercase tracking-widest italic animate-pulse">
                      * Quá thời hạn quy định ghi trong giấy báo, kết quả trúng tuyển sẽ tự động bị hủy bỏ.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Guide Card */}
          <div className="mt-12 bg-slate-50 dark:bg-slate-900/40 rounded-[2.5rem] p-10 text-center border border-gray-50 dark:border-slate-800">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Hỗ trợ thí sinh</h4>
            <p className="text-sm text-slate-500 font-medium italic mb-2">Thông tin tra cứu chưa chính xác hoặc gặp sự cố kỹ thuật?</p>
            <p className="text-lg font-black text-[#003A8C] dark:text-[#D4B106]">Phòng đào tạo - Hotline: (028) 3896 6798</p>
          </div>
        </div>
      </div>
    </div>
  );
}

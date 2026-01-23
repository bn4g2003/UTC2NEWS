'use client';

import { useEffect, useState } from 'react';
import { CmsService } from '@/api/services/CmsService';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Download, FileText, HelpCircle } from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
  category?: string;
  isActive: boolean;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  status: string;
  publishedAt?: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface TemplateFile {
  name: string;
  description: string;
  url: string;
  icon: React.ReactNode;
}

export default function GuidesPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [guidePosts, setGuidePosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Template files for download
  const templateFiles: TemplateFile[] = [
    {
      name: 'Mẫu nhập liệu sinh viên',
      description: 'File Excel mẫu để nhập thông tin sinh viên hàng loạt',
      url: '/api/import/template',
      icon: <FileText className="h-6 w-6" />,
    },
    {
      name: 'Hướng dẫn đăng ký',
      description: 'Tài liệu PDF hướng dẫn quy trình đăng ký tuyển sinh',
      url: '/documents/huong-dan-dang-ky.pdf',
      icon: <FileText className="h-6 w-6" />,
    },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Fetch active FAQs
      const faqsResponse = await CmsService.cmsControllerFindAllFaqs('true');
      const faqsData = Array.isArray(faqsResponse) ? faqsResponse : [];
      
      // Sort FAQs by order
      const sortedFaqs = faqsData.sort((a: FAQ, b: FAQ) => a.order - b.order);
      setFaqs(sortedFaqs);

      // Fetch guide posts (posts with "guide" category or similar)
      const postsResponse = await CmsService.cmsControllerFindAllPosts('true');
      const postsData = Array.isArray(postsResponse) ? postsResponse : [];
      
      // Filter for guide posts (you can adjust this logic based on your category structure)
      const guides = postsData.filter((post: Post) => 
        post.category?.slug === 'huong-dan' || 
        post.category?.name?.toLowerCase().includes('hướng dẫn')
      );
      setGuidePosts(guides);
    } catch (error) {
      console.error('Error loading guides and FAQs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Group FAQs by category
  const groupedFaqs = faqs.reduce((acc, faq) => {
    const category = faq.category || 'Chung';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  const categories = ['all', ...Object.keys(groupedFaqs)];

  // Filter FAQs by selected category
  const filteredFaqs = selectedCategory === 'all' 
    ? faqs 
    : groupedFaqs[selectedCategory] || [];

  const handleDownload = (url: string, filename: string) => {
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-gradient-to-b from-white to-gray-50 dark:from-background dark:to-card min-h-screen">
      <div className="utc-container">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <h1 className="utc-heading">📖 Hướng dẫn & Câu hỏi thường gặp</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Tìm hiểu quy trình tuyển sinh và câu trả lời cho các thắc mắc phổ biến
          </p>
        </div>

        {/* Guide Posts Section */}
        {guidePosts.length > 0 && (
          <section className="mb-12">
            <h2 className="utc-subheading flex items-center gap-2 justify-center md:justify-start">
              <FileText className="h-6 w-6 text-[#003DA5] dark:text-[#FFD700]" />
              Tài liệu hướng dẫn
            </h2>
            <div className="utc-grid">
              {guidePosts.map((post) => (
                <a
                  key={post.id}
                  href={`/tin-tuc/${post.slug}`}
                  className="utc-card hover:shadow-xl transition-all"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="mt-4 utc-link text-sm">
                    Xem chi tiết →
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Template Downloads Section */}
        <section className="mb-12">
          <h2 className="utc-subheading flex items-center gap-2 justify-center md:justify-start">
            <Download className="h-6 w-6 text-[#003DA5] dark:text-[#FFD700]" />
            Tải xuống biểu mẫu
          </h2>
          <div className="utc-grid">
            {templateFiles.map((file, index) => (
              <div key={index} className="utc-card">
                <div className="flex items-start gap-4">
                  <div className="text-[#003DA5] dark:text-[#FFD700] mt-1">{file.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {file.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                      {file.description}
                    </p>
                    <button
                      onClick={() => handleDownload(file.url, file.name)}
                      className="utc-button-secondary text-sm py-2 px-4"
                    >
                      <Download className="h-4 w-4 inline mr-2" />
                      Tải xuống
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQs Section */}
        <section>
          <h2 className="utc-subheading flex items-center gap-2 justify-center md:justify-start">
            <HelpCircle className="h-6 w-6 text-[#003DA5] dark:text-[#FFD700]" />
            Câu hỏi thường gặp
          </h2>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="utc-card animate-pulse">
                  <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : faqs.length > 0 ? (
            <>
              {/* Category Filter */}
              {categories.length > 2 && (
                <div className="mb-6">
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                          selectedCategory === category
                            ? 'bg-[#003DA5] dark:bg-[#FFD700] text-white dark:text-[#0A1628] shadow-lg'
                            : 'bg-white dark:bg-card text-gray-700 dark:text-gray-300 border-2 border-border hover:border-[#FFD700] hover:shadow-md'
                        }`}
                      >
                        {category === 'all' ? 'Tất cả' : category}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* FAQ Accordion */}
              <div className="utc-card">
                <Accordion type="single" collapsible className="w-full">
                  {filteredFaqs.map((faq, index) => (
                    <AccordionItem key={faq.id} value={`item-${index}`}>
                      <AccordionTrigger className="text-left text-gray-900 dark:text-gray-100 font-semibold hover:text-[#003DA5] dark:hover:text-[#FFD700]">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-700 dark:text-gray-300">
                        <div dangerouslySetInnerHTML={{ __html: faq.answer }} />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              {filteredFaqs.length === 0 && selectedCategory !== 'all' && (
                <div className="utc-card text-center py-12">
                  <div className="text-6xl mb-4">❓</div>
                  <p className="text-gray-500 dark:text-gray-400 text-lg">
                    Không có câu hỏi nào trong danh mục này.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="utc-card text-center py-12">
              <div className="text-6xl mb-4">❓</div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                Chưa có câu hỏi thường gặp nào được đăng tải.
              </p>
            </div>
          )}
        </section>

        {/* Contact Section */}
        <section className="mt-12 utc-card bg-gradient-to-br from-[#FFD700]/10 to-[#FFC700]/10 dark:from-[#1A2942] dark:to-[#2A3F5F] border-[#FFD700]">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            💬 Không tìm thấy câu trả lời?
          </h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Nếu bạn có thắc mắc khác, vui lòng liên hệ với chúng tôi qua:
          </p>
          <div className="space-y-2 text-gray-700 dark:text-gray-300">
            <p>
              <strong>Email:</strong>{' '}
              <a href="mailto:tuyensinh@utc2.edu.vn" className="utc-link">
                tuyensinh@utc2.edu.vn
              </a>
            </p>
            <p>
              <strong>Điện thoại:</strong>{' '}
              <a href="tel:+842838966798" className="utc-link">
                (028) 3896 6798
              </a>
            </p>
            <p>
              <strong>Địa chỉ:</strong> 450-451 Lê Văn Việt, Phường Tăng Nhơn Phú A, TP. Thủ Đức, TP. Hồ Chí Minh
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

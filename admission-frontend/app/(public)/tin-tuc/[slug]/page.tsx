'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { CmsService } from '@/api/services/CmsService';

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
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  author?: {
    id: string;
    fullName: string;
  };
}

export default function PostDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [post, setPost] = useState<Post | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug) {
      loadPostData();
    }
  }, [slug]);

  const loadPostData = async () => {
    try {
      setIsLoading(true);
      setNotFound(false);

      const postsResponse = await CmsService.cmsControllerFindAllPosts('true');
      const posts = Array.isArray(postsResponse) ? postsResponse : [];

      const foundPost = posts.find((p: Post) => p.slug === slug);

      if (!foundPost) {
        setNotFound(true);
        return;
      }

      setPost(foundPost);

      // Related posts
      const related = posts
        .filter((p: Post) => p.id !== foundPost.id && p.category?.id === foundPost.category?.id)
        .slice(0, 3);
      setRelatedPosts(related);

      // Recent posts
      const recent = posts
        .filter((p: Post) => p.id !== foundPost.id)
        .sort((a: Post, b: Post) => {
          const dateA = new Date(a.publishedAt || a.createdAt).getTime();
          const dateB = new Date(b.publishedAt || b.createdAt).getTime();
          return dateB - dateA;
        })
        .slice(0, 5);
      setRecentPosts(recent);
    } catch (error) {
      console.error('Error loading post:', error);
      setNotFound(true);
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

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-950 min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-8 max-w-4xl mx-auto">
            <div className="h-4 bg-slate-100 dark:bg-slate-900 rounded w-48"></div>
            <div className="h-12 bg-slate-100 dark:bg-slate-900 rounded w-full"></div>
            <div className="h-96 bg-slate-100 dark:bg-slate-900 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="bg-white dark:bg-slate-950 min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <h1 className="text-2xl font-bold dark:text-white">Không tìm thấy bài viết</h1>
          <Link href="/tin-tuc" className="utc-button-primary">Quay lại tin tức</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen">
      {/* Article Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-7xl mx-auto">

          <div className="lg:col-span-8">
            <article>
              {/* Breadcrumb - Clean & Simple */}
              <nav className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">
                <Link href="/" className="hover:text-[#003A8C] transition-colors">UTC2</Link>
                <span>/</span>
                <Link href="/tin-tuc" className="hover:text-[#003A8C] transition-colors">Tin tức</Link>
                {post.category && (
                  <>
                    <span>/</span>
                    <span className="text-[#003A8C] dark:text-[#D4B106]">{post.category.name}</span>
                  </>
                )}
              </nav>

              {/* Title - Ultra High Contrast */}
              <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white leading-tight mb-6 uppercase tracking-tight">
                {post.title}
              </h1>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-8 mb-8">
                <div className="flex items-center gap-2 uppercase tracking-wide">
                  <span className="text-[#D4B106]">📅</span> {formatDate(post.publishedAt || post.createdAt)}
                </div>
                {post.author && (
                  <div className="flex items-center gap-2 uppercase tracking-wide">
                    <span className="text-[#D4B106]">👤</span> {post.author.fullName}
                  </div>
                )}
                <div className="flex items-center gap-2 uppercase tracking-wide">
                  <span className="text-[#D4B106]">🏷️</span> {post.category?.name || 'Thông báo'}
                </div>
              </div>

              {/* Featured Image - Clean edges */}
              {post.featuredImage && (
                <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-lg mb-10 border border-slate-100 dark:border-slate-800">
                  <Image
                    src={post.featuredImage}
                    alt={post.title}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              )}

              {/* Content Body - Maximum Contrast Fix */}
              <div className="prose prose-lg dark:prose-invert max-w-none 
                prose-headings:text-gray-900 dark:prose-headings:text-white prose-headings:font-black prose-headings:uppercase
                prose-p:text-gray-950 dark:prose-p:text-slate-100 prose-p:leading-relaxed prose-p:text-justify
                prose-strong:text-black dark:prose-strong:text-white prose-strong:font-black
                prose-a:text-[#003A8C] dark:prose-a:text-[#D4B106] prose-a:font-bold
                prose-img:rounded-2xl prose-img:shadow-md
                prose-blockquote:border-l-4 prose-blockquote:border-slate-200 dark:prose-blockquote:border-[#D4B106]
                prose-li:text-gray-900 dark:prose-li:text-slate-100">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]}>
                  {post.content}
                </ReactMarkdown>
              </div>

              {/* Share */}
              <div className="mt-16 pt-8 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Chia sẻ:</span>
                  <div className="flex gap-4">
                    <button
                      onClick={() => navigator.share?.({ title: post.title, url: window.location.href })}
                      className="text-slate-500 hover:text-[#003A8C] dark:hover:text-[#D4B106] transition-colors"
                    >
                      📎 Gửi liên kết
                    </button>
                    <button
                      onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Đã sao chép liên kết!'); }}
                      className="text-slate-500 hover:text-[#003A8C] dark:hover:text-[#D4B106] transition-colors"
                    >
                      📋 Sao chép
                    </button>
                  </div>
                </div>
              </div>
            </article>
          </div>

          {/* Sidebar - Clean & Professional */}
          <aside className="lg:col-span-4 space-y-12">
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                <span className="w-4 h-1 bg-[#D4B106]"></span>
                Tin mới nhất
              </h3>
              <div className="space-y-8">
                {recentPosts.map((p) => (
                  <Link key={p.id} href={`/tin-tuc/${p.slug}`} className="flex gap-4 group">
                    <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900">
                      <Image
                        src={p.featuredImage || '/b2.jpg'}
                        alt={p.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-110"
                      />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-[#003A8C] transition-colors line-clamp-2 uppercase leading-snug">
                        {p.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
                        {formatDate(p.publishedAt || p.createdAt)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-[#003A8C] dark:text-[#D4B106] uppercase tracking-widest mb-4">Hỗ trợ tư vấn</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 font-medium italic">
                Nếu bạn cần giải đáp thông tin về quy chế tuyển sinh, hãy liên lạc với chúng tôi.
              </p>
              <Link href="/huong-dan" className="block text-center py-3 bg-[#003A8C] dark:bg-[#D4B106] text-white dark:text-black rounded-xl font-black text-[10px] uppercase tracking-widest">
                Liên hệ ngay
              </Link>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';
import Image from 'next/image';

interface NewsCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    content?: string;
    featuredImage?: string;
    publishedAt?: string;
    createdAt: string;
    category?: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

export function NewsCard({ post }: NewsCardProps) {
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

  // Helper to get preview text (excerpt or stripped content)
  const getPreviewText = () => {
    if (post.excerpt) return post.excerpt;
    if (!post.content) return '';

    // Simple strip of markdown/html for preview
    // Ensure content is a string before calling replace
    const content = String(post.content);
    let text = content
      .replace(/<[^>]*>?/gm, '') // Strip HTML
      .replace(/[#*`_~\[\]()]/g, '') // Strip Markdown syntax chars
      .replace(/\s+/g, ' ') // Collapse whitespace
      .trim();

    return text.length > 200 ? text.substring(0, 200) + '...' : text;
  };

  return (
    <Link href={`/tin-tuc/${post.slug}`} className="utc-news-card block group shadow-sm hover:shadow-lg transition-all p-0 rounded-lg bg-white dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 overflow-hidden mb-0 h-full">
      <div className="flex flex-row h-full">
        {/* Featured Image - Left Side - Smaller */}
        <div className="relative w-32 md:w-48 min-w-[8rem] bg-slate-100 dark:bg-slate-800 shrink-0">
          {post.featuredImage ? (
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#003A8C]/5 to-[#003A8C]/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-[#003A8C]/20"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
            </div>
          )}
          {post.category && (
            <div className="absolute top-2 left-2 z-10">
              <span className="bg-[#003A8C] dark:bg-[#D4B106] text-white dark:text-black px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shadow-md">
                {post.category.name}
              </span>
            </div>
          )}
        </div>

        {/* Content - Right Side */}
        <div className="flex-1 p-3 md:p-4 flex flex-col overflow-hidden">
          {/* Title - Smaller & More Lines */}
          <h3 className="text-sm md:text-base font-bold text-gray-900 dark:text-white mb-2 group-hover:text-[#003A8C] dark:group-hover:text-[#D4B106] transition-colors leading-snug line-clamp-3">
            {post.title}
          </h3>

          {/* Date & Preview - Compact Row */}
          <div className="flex items-center gap-3 text-[9px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
            <span>{formatDate(post.publishedAt || post.createdAt)}</span>
          </div>

          {/* Excerpt - Smaller & auto-generated */}
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed line-clamp-2 md:line-clamp-3 mb-2 font-normal text-justify">
            {getPreviewText()}
          </p>

          {/* Read More Link */}
          <div className="mt-auto flex items-center gap-1 text-[9px] font-black text-[#003A8C] dark:text-[#D4B106] uppercase tracking-wider">
            Xem chi tiết
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

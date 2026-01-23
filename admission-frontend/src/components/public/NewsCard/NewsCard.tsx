import Link from 'next/link';

interface NewsCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
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

  return (
    <Link href={`/tin-tuc/${post.slug}`} className="utc-news-card block group border-none shadow-md hover:shadow-2xl transition-all h-full flex flex-col p-6 rounded-[2.5rem] bg-white dark:bg-slate-900/50 border border-gray-50 dark:border-slate-800">
      {/* Featured Image */}
      <div className="relative w-full h-52 mb-6 overflow-hidden rounded-[1.5rem] bg-slate-100 dark:bg-slate-800">
        {post.featuredImage ? (
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#003A8C]/5 to-[#003A8C]/10 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-[#003A8C]/20"
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
          <div className="absolute top-4 left-4">
            <span className="bg-[#003A8C] dark:bg-[#D4B106] text-white dark:text-black px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl">
              {post.category.name}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        {/* Date */}
        <div className="text-[10px] font-black text-slate-400 mb-3 uppercase tracking-[0.2em] italic">
          {formatDate(post.publishedAt || post.createdAt)}
        </div>

        {/* Title */}
        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3 group-hover:text-[#003A8C] dark:group-hover:text-[#D4B106] transition-colors line-clamp-2 leading-tight uppercase tracking-tighter">
          {post.title}
        </h3>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 line-clamp-2 italic font-medium">
            {post.excerpt}
          </p>
        )}

        {/* Read More Link */}
        <div className="mt-auto flex items-center gap-2 text-[10px] font-black text-[#003A8C] dark:text-[#D4B106] uppercase tracking-[0.2em]">
          Chi tiết
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
        </div>
      </div>
    </Link>
  );
}

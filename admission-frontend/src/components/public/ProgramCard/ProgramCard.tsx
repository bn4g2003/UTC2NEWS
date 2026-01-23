import Link from 'next/link';

interface ProgramCardProps {
  program: {
    id: string;
    name: string;
    code: string;
    description?: string;
    quota?: number;
    isActive: boolean;
  };
}

export function ProgramCard({ program }: ProgramCardProps) {
  return (
    <div className="utc-card group relative hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors border-none shadow-lg">
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#003A8C]/5 rounded-bl-[5rem] group-hover:bg-[#D4B106]/10 transition-colors z-0"></div>

      <div className="relative z-10">
        {/* Program Code Badge */}
        <div className="inline-flex items-center px-3 py-1 bg-[#F0F5FF] dark:bg-slate-800 text-[#003A8C] dark:text-[#D4B106] text-[10px] font-black uppercase tracking-widest rounded-md mb-4 border border-blue-50 dark:border-slate-700">
          Mã ngành: {program.code}
        </div>

        {/* Program Name */}
        <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-4 line-clamp-2 leading-tight group-hover:text-[#003A8C] transition-colors uppercase">
          {program.name}
        </h3>

        {/* Program Description */}
        {program.description && (
          <p className="text-muted-foreground text-sm mb-6 line-clamp-3 italic">
            {program.description}
          </p>
        )}

        {/* Program Info */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#D4B106]/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4B106" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            </div>
            <div className="text-xs">
              <span className="text-muted-foreground block font-bold uppercase tracking-tighter scale-90 -ml-1">Chỉ tiêu</span>
              <span className="font-black text-gray-900 dark:text-white">
                {program.quota !== undefined && program.quota !== null ? program.quota : 'N/A'}
              </span>
            </div>
          </div>

          {/* View Details Link */}
          <Link
            href={`/nganh-tuyen-sinh/${program.id}`}
            className="flex items-center gap-1.5 text-xs font-black text-[#003A8C] dark:text-[#D4B106] uppercase tracking-widest group-hover:underline"
          >
            Chi tiết
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

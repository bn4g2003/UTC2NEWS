import { ReactNode } from 'react';
import { PublicHeader, PublicFooter } from '@/components/public/PublicLayout';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicHeader />
      <main className="flex-1">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}

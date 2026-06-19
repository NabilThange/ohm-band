'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Trigger view transition on route change
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as any).startViewTransition(() => {
        // The route change happens here automatically
      }).finished.then(() => {
        // ponytail: Browser bug leaves overflow:hidden stuck after transition
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
      }).catch(() => {
        // Cleanup even on error
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
      });
    }
  }, [pathname]);

  return <>{children}</>;
}

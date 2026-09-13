import type { ReactNode } from 'react';
import { ContourMark } from './AppShell';

interface AuthShellProps {
  children: ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="bg-contour-canvas flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="mb-8 flex items-center gap-2.5 text-primary">
        <ContourMark size={30} />
        <span className="font-display text-display text-primary">Contour</span>
      </div>
      <div className="w-full max-w-[400px] rounded-2xl border border-border-default bg-surface-elevated p-8 shadow-lg">
        {children}
      </div>
    </div>
  );
}

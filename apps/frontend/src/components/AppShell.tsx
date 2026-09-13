import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { WorkspaceSwitcher } from '../features/workspace/WorkspaceSwitcher';
import { UserMenu } from '../features/workspace/UserMenu';

interface AppShellProps {
  children: ReactNode;
  currentWorkspaceId?: string;
  currentWorkspaceName?: string;
  boardName?: string;
}

export function ContourMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 6.5A9.5 9.5 0 1 0 20 17.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M17.3 8.3a6.2 6.2 0 1 0 0 7.4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        opacity="0.78"
      />
      <path
        d="M14.5 10.4a3.1 3.1 0 1 0 0 3.2"
        stroke="var(--trail)"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Crumb({ children }: { children: ReactNode }) {
  return (
    <>
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-shell-text-muted/70" aria-hidden="true" />
      {children}
    </>
  );
}

export function AppShell({
  children,
  currentWorkspaceId,
  currentWorkspaceName,
  boardName,
}: AppShellProps) {
  return (
    <div className="flex h-screen flex-col bg-shell-well">
      <div className="shrink-0 px-3 pt-3">
        <header className="mx-auto flex h-16 max-w-[1680px] items-center justify-between gap-4 rounded-2xl border border-shell-border bg-shell-gradient px-4 shadow-lg sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5 text-shell-text">
            {currentWorkspaceId ? (
              <Link
                to="/workspaces"
                className="flex shrink-0 items-center gap-2 rounded-lg px-2 py-1.5 text-shell-text transition-colors duration-micro hover:bg-white/[0.06]"
              >
                <ContourMark />
                <span className="font-display text-[1.1rem] font-semibold tracking-tight">
                  Contour
                </span>
              </Link>
            ) : (
              <span className="flex shrink-0 items-center gap-2 px-2 py-1.5 text-shell-text">
                <ContourMark />
                <span className="font-display text-[1.1rem] font-semibold tracking-tight">
                  Contour
                </span>
              </span>
            )}
            {currentWorkspaceId && (
              <Crumb>
                <WorkspaceSwitcher currentWorkspaceName={currentWorkspaceName} />
              </Crumb>
            )}
            {boardName && (
              <Crumb>
                <span className="truncate rounded-lg px-2 py-1.5 text-body-medium text-shell-text">
                  {boardName}
                </span>
              </Crumb>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden h-6 w-px bg-white/10 sm:block" aria-hidden="true" />
            <UserMenu />
          </div>
        </header>
      </div>
      <main className="min-h-0 flex-1">{children}</main>
    </div>
  );
}

import { useRef, useState } from 'react';
import { ChevronDown, LogOut } from 'lucide-react';
import { Avatar } from '../../components/Avatar';
import { Popover } from '../../components/Popover';
import { useAuth } from '../../state/auth';

export function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  if (!user) return null;

  const firstName = user.name.trim().split(/\s+/)[0];

  return (
    <div className="relative">
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`Account menu for ${user.name}`}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors duration-micro hover:bg-white/[0.06] focus-visible:outline-none sm:rounded-lg sm:pr-2.5"
      >
        <Avatar name={user.name} size="md" />
        <span className="hidden max-w-[8rem] truncate text-body-medium text-shell-text sm:inline">
          {firstName}
        </span>
        <ChevronDown className="hidden h-3.5 w-3.5 shrink-0 text-shell-text-muted sm:block" aria-hidden="true" />
      </button>
      <Popover isOpen={isOpen} onClose={() => setIsOpen(false)} anchorRef={anchorRef} align="right">
        <div className="px-2.5 py-2">
          <p className="truncate text-body-medium text-primary">{user.name}</p>
          <p className="truncate text-meta text-muted">{user.email}</p>
        </div>
        <div className="mt-1 border-t border-border-default pt-1">
          <button
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              logout();
            }}
            className="flex w-full items-center gap-1.5 rounded px-2.5 py-1.5 text-left text-body text-primary hover:bg-surface-hover"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            Log out
          </button>
        </div>
      </Popover>
    </div>
  );
}

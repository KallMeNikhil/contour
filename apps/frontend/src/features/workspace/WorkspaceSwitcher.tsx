import { useRef, useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Popover } from '../../components/Popover';
import { useCreateWorkspace, useWorkspaces } from './hooks';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';

interface WorkspaceSwitcherProps {
  currentWorkspaceName?: string;
}

export function WorkspaceSwitcher({ currentWorkspaceName }: WorkspaceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const { data: workspaces } = useWorkspaces();
  const createWorkspace = useCreateWorkspace();

  return (
    <div className="relative">
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-body-medium text-shell-text transition-colors duration-micro hover:bg-white/[0.06]"
      >
        {currentWorkspaceName ?? 'Workspaces'}
        <ChevronDown className="h-3.5 w-3.5 text-shell-text-muted" aria-hidden="true" />
      </button>
      <Popover isOpen={isOpen} onClose={() => setIsOpen(false)} anchorRef={anchorRef}>
        <div className="max-h-72 overflow-y-auto">
          {workspaces?.map((ws) => (
            <button
              key={ws._id}
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                navigate(`/workspaces/${ws._id}`);
              }}
              className="block w-full truncate rounded px-2.5 py-1.5 text-left text-body text-primary hover:bg-surface-hover"
            >
              {ws.name}
            </button>
          ))}
        </div>
        <div className="mt-1 border-t border-border-default pt-1">
          <button
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              setIsCreateOpen(true);
            }}
            className="flex w-full items-center gap-1.5 rounded px-2.5 py-1.5 text-left text-body font-medium text-trail hover:bg-surface-hover"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            New workspace
          </button>
        </div>
      </Popover>
      <CreateWorkspaceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={async (name) => {
          const ws = await createWorkspace.mutateAsync(name);
          setIsCreateOpen(false);
          navigate(`/workspaces/${ws._id}`);
        }}
      />
    </div>
  );
}

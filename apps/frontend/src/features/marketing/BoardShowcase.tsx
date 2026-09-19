import { useEffect, useRef, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { TaskCard } from '../board/TaskCard';
import type {
  BoardLabel,
  PublicUser,
  Task,
  WorkspaceMemberSummary,
} from '../../services/api/types';
import { useFinePointer, useInView, useMinWidth, useReducedMotion } from './motion';

const now = new Date().toISOString();

const LABELS: BoardLabel[] = [
  { _id: 'l1', name: 'Design', color: 'moss' },
  { _id: 'l2', name: 'Copy', color: 'ochre' },
  { _id: 'l3', name: 'Bug', color: 'clay' },
];

const MEMBERS: WorkspaceMemberSummary[] = [];
const CURRENT_USER: PublicUser | null = null;

function fixtureTask(
  id: string,
  title: string,
  columnId: string,
  labelId: string,
  position: number,
): Task {
  return {
    _id: id,
    boardId: 'preview-board',
    columnId,
    title,
    description: '',
    assigneeId: null,
    labelIds: [labelId],
    dueDate: null,
    position,
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
}

const BACKLOG = [
  fixtureTask('t1', 'Sketch column header states', 'backlog', 'l1', 1000),
  fixtureTask('t2', 'Draft empty-state copy', 'backlog', 'l2', 2000),
];

const IN_PROGRESS = [
  fixtureTask('t3', 'Wire up keyboard drag sensor', 'in-progress', 'l1', 1000),
  fixtureTask('t4', 'Fix column count off-by-one', 'in-progress', 'l3', 2000),
];

const DONE = [
  fixtureTask('t6', 'Set up realtime board rooms', 'done', 'l1', 1000),
  fixtureTask('t7', 'Add role-based route guards', 'done', 'l3', 2000),
];

const MOVING_TASK = fixtureTask('t5', 'Write onboarding copy', 'in-progress', 'l2', 3000);

interface PreviewColumnProps {
  name: string;
  count: number;
  children: ReactNode;
}

function PreviewColumn({ name, count, children }: PreviewColumnProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--column-divider)] bg-[var(--bg-column)] shadow-xs">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--column-header-rule)] px-3.5 py-3">
        <span className="text-column-header text-primary">{name}</span>
        <span className="font-data text-data text-muted">{count}</span>
      </div>
      <div className="flex flex-col gap-2 p-2.5">{children}</div>
    </div>
  );
}

/**
 * A faithful, static-data reproduction of the real board view, used purely
 * to demonstrate the product. It reuses the actual TaskCard/Chip components
 * so it can never visually drift from the real app. The one animated
 * moment - the highlighted card sliding from "In Progress" into "Done" -
 * mirrors an ordinary drag-and-drop move the product already supports; it
 * is not a fabricated interaction, and it plays once, not on a loop.
 */
export function BoardShowcase() {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.35 });
  const [hasMoved, setHasMoved] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const reducedMotion = useReducedMotion();
  const isWideEnough = useMinWidth(768);
  const canAnimate = isWideEnough && !reducedMotion;
  const isFinePointer = useFinePointer();
  const glowEnabled = isFinePointer && !reducedMotion;
  const triggered = useRef(false);

  useEffect(() => {
    if (!inView || triggered.current) return;
    triggered.current = true;

    if (!canAnimate) {
      setHasMoved(true);
      return;
    }

    const startTimer = window.setTimeout(() => setIsSliding(true), 900);
    const landTimer = window.setTimeout(() => setHasMoved(true), 1800);
    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(landTimer);
    };
  }, [inView, canAnimate]);

  const inProgressTasks = hasMoved ? IN_PROGRESS : [...IN_PROGRESS, MOVING_TASK];
  const doneTasks = hasMoved ? [...DONE, MOVING_TASK] : DONE;

  const inertProps = { inert: '' } as unknown as { inert?: string };

  function handlePointerMove(event: MouseEvent<HTMLDivElement>) {
    if (!glowEnabled) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--glow-x', `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty('--glow-y', `${event.clientY - rect.top}px`);
  }

  return (
    <div
      ref={ref}
      aria-hidden="true"
      {...inertProps}
      onMouseMove={handlePointerMove}
      className="relative w-full overflow-hidden rounded-2xl border border-border-default bg-surface-elevated p-3 shadow-lg sm:p-4"
      style={{ ['--board-preview-gap' as string]: '0.625rem' }}
    >
      {glowEnabled && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 hover:opacity-100"
          style={{
            background:
              'radial-gradient(360px circle at var(--glow-x, 50%) var(--glow-y, 0%), var(--accent-soft), transparent 70%)',
          }}
        />
      )}
      <div className="relative mb-3 flex items-center justify-between px-1">
        <span className="font-display text-display-sm text-primary">Launch checklist</span>
        <span className="text-meta text-muted">3 columns</span>
      </div>
      <div
        className="relative flex flex-col gap-2.5 sm:flex-row"
        style={{ gap: 'var(--board-preview-gap)' }}
      >
        <PreviewColumn name="Backlog" count={BACKLOG.length}>
          {BACKLOG.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              boardLabels={LABELS}
              members={MEMBERS}
              currentUser={CURRENT_USER}
              isSelected={false}
              onOpen={() => {}}
            />
          ))}
        </PreviewColumn>
        <PreviewColumn name="In progress" count={inProgressTasks.length}>
          {inProgressTasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              boardLabels={LABELS}
              members={MEMBERS}
              currentUser={CURRENT_USER}
              isSelected={false}
              onOpen={() => {}}
              className={task._id === 't5' && isSliding ? 'card-slide-to-next-column' : undefined}
            />
          ))}
        </PreviewColumn>
        <PreviewColumn name="Done" count={doneTasks.length}>
          {doneTasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              boardLabels={LABELS}
              members={MEMBERS}
              currentUser={CURRENT_USER}
              isSelected={false}
              onOpen={() => {}}
            />
          ))}
        </PreviewColumn>
      </div>
    </div>
  );
}

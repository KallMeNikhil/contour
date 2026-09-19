import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Columns3,
  Gauge,
  Layers,
  LayoutGrid,
  ShieldCheck,
  Wifi,
} from 'lucide-react';
import { ContourMark } from '../components/AppShell';
import { Reveal } from '../features/marketing/Reveal';
import { MagneticLink } from '../features/marketing/MagneticButton';
import { ScrollProgress } from '../features/marketing/ScrollProgress';
import { ContourField } from '../features/marketing/ContourField';
import { BoardShowcase } from '../features/marketing/BoardShowcase';

const primaryCta =
  'inline-flex items-center justify-center gap-1.5 rounded-md border border-accent bg-accent px-5 py-2.5 text-body-medium font-semibold text-accent-foreground shadow-sm transition-shadow duration-micro hover:shadow-md';

const secondaryCta =
  'inline-flex items-center justify-center rounded-md border border-border-strong bg-surface px-5 py-2.5 text-body-medium font-semibold text-primary shadow-xs transition-all duration-micro ease-settle hover:bg-surface-hover';

const hierarchy = [
  {
    icon: Layers,
    name: 'Workspace',
    description: 'One team, its members, and everything they own.',
  },
  {
    icon: LayoutGrid,
    name: 'Board',
    description: 'A single project or engagement, scoped to a workspace.',
  },
  {
    icon: Columns3,
    name: 'Column',
    description: 'A stage in your workflow - Backlog, In Progress, Done.',
  },
  {
    icon: CheckCircle2,
    name: 'Task',
    description: 'The actual work, with an owner and a due date.',
  },
];

const facts = [
  { value: '4', label: 'levels: workspace, board, column, task' },
  { value: '3', label: 'roles, enforced on the server' },
  { value: '1', label: 'request loads a full board' },
];

const secondaryFeatures = [
  {
    icon: Wifi,
    title: 'Real-time by default',
    description: 'Move a card and every teammate watching the board sees it land, instantly.',
  },
  {
    icon: ShieldCheck,
    title: 'Roles that mean something',
    description: 'Owner, editor, viewer - enforced on the server, not just hidden in the UI.',
  },
  {
    icon: Gauge,
    title: 'One request per board',
    description:
      'Columns and tasks load together, so opening a board never feels like waiting on a queue.',
  },
];

const keys = ['Tab', 'Space', '←', '→', 'Esc'];

function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border-default/70 bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-5">
        <div className="flex items-center gap-2 text-primary">
          <ContourMark size={22} />
          <span className="font-display text-display-sm">Contour</span>
        </div>
        <nav className="hidden items-center gap-6 md:flex">
          <a
            href="#hierarchy"
            className="text-body-medium text-secondary transition-colors duration-micro hover:text-primary"
          >
            How it works
          </a>
          <a
            href="#features"
            className="text-body-medium text-secondary transition-colors duration-micro hover:text-primary"
          >
            Features
          </a>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/login"
            className="rounded-md px-3 py-2 text-body-medium text-secondary transition-colors duration-micro hover:text-primary"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center justify-center rounded-md border border-accent bg-accent px-3.5 py-2 text-body-medium font-semibold text-accent-foreground shadow-xs transition-all duration-micro ease-settle hover:bg-accent-hover hover:shadow-sm"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="hero" className="relative overflow-hidden">
      <ContourField />
      <div className="relative mx-auto grid max-w-[1180px] gap-12 px-5 pb-16 pt-16 sm:pb-20 sm:pt-24 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:items-center lg:gap-8">
        <div>
          <Reveal>
            <h1 className="font-display text-display-xl text-primary sm:text-[3.25rem] sm:leading-[1.05]">
              <span className="block">A Kanban board that</span>
              <span className="block">stays out of your team&rsquo;s way.</span>
            </h1>
          </Reveal>
          <Reveal index={1}>
            <p className="mt-5 max-w-[46ch] text-body text-secondary sm:text-[1.0625rem] sm:leading-relaxed">
              Workspaces, boards, columns, and tasks - real accounts, real permissions, and a
              drag-and-drop that survives a page reload. Built for small teams who want their board
              to work, not to impress anyone.
            </p>
          </Reveal>
          <Reveal index={2}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <MagneticLink to="/register" className={primaryCta}>
                Create a workspace
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </MagneticLink>
              <Link to="/login" className={secondaryCta}>
                Sign in
              </Link>
            </div>
          </Reveal>
          <Reveal index={3}>
            <dl className="mt-10 flex max-w-[440px] items-start gap-6 border-t border-border-default pt-6">
              {facts.map((fact) => (
                <div key={fact.label} className="flex-1">
                  <dt className="sr-only">{fact.label}</dt>
                  <dd>
                    <span className="font-data text-display-sm text-primary">{fact.value}</span>
                    <span className="mt-1 block max-w-[16ch] text-meta text-muted">
                      {fact.label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
        <Reveal index={2} className="lg:pl-4">
          <BoardShowcase />
        </Reveal>
      </div>
    </section>
  );
}

function HierarchySection() {
  return (
    <section
      id="hierarchy"
      className="scroll-anchor border-t border-border-default/70 bg-surface-raised/60"
    >
      <div className="mx-auto max-w-[1180px] px-5 py-16 sm:py-20">
        <Reveal>
          <h2 className="max-w-[38ch] font-display text-display text-primary">
            Four ideas. Nothing you have to learn.
          </h2>
        </Reveal>
        <Reveal index={1}>
          <p className="mt-3 max-w-[56ch] text-body text-secondary">
            Contour doesn&rsquo;t reinvent Kanban vocabulary. It keeps the hierarchy small and
            literal, so a new teammate understands the whole structure in one glance.
          </p>
        </Reveal>
        <Reveal index={2}>
          <div className="hairline-grid mt-12 grid grid-cols-1 overflow-hidden rounded-xl border border-border-default sm:grid-cols-2 lg:grid-cols-4">
            {hierarchy.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.name} className="bg-surface px-6 py-7">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-default bg-surface-raised text-accent">
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  <span className="mt-4 block text-page-title text-primary">{step.name}</span>
                  <span className="mt-1 block max-w-[26ch] text-body text-secondary">
                    {step.description}
                  </span>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FeatureSection() {
  return (
    <section id="features" className="scroll-anchor border-t border-border-default/70">
      <div className="mx-auto max-w-[1180px] px-5 py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <Reveal>
            <h2 className="max-w-[24ch] font-display text-display text-primary">
              Drag-and-drop that works without a mouse.
            </h2>
            <p className="mt-4 max-w-[48ch] text-body text-secondary">
              Pick up a card with the keyboard, move it between columns, and drop it exactly where
              it belongs - the same interaction a screen-reader or trackpad-free user gets, not a
              fallback bolted on afterward.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-2">
              {keys.map((key) => (
                <kbd
                  key={key}
                  className="rounded-md border border-border-strong bg-surface px-2.5 py-1.5 font-data text-data text-secondary shadow-xs"
                >
                  {key}
                </kbd>
              ))}
            </div>
            <p className="mt-3 text-meta text-muted">
              Pick up, move between columns, and drop - start to finish.
            </p>
          </Reveal>

          <Reveal index={1}>
            <ul className="divide-y divide-border-default border-y border-border-default">
              {secondaryFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <li key={feature.title} className="flex items-start gap-4 py-5">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-default bg-surface text-accent">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <span className="block text-page-title text-primary">{feature.title}</span>
                      <span className="mt-1 block max-w-[42ch] text-body text-secondary">
                        {feature.description}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function ClosingCta() {
  return (
    <section className="border-t border-border-default/70 bg-shell-well">
      <div className="mx-auto max-w-[1180px] px-5 py-16 text-center sm:py-20">
        <Reveal>
          <h2 className="mx-auto max-w-[30ch] font-display text-display-lg text-primary">
            Set up your first board in the time it takes to make coffee.
          </h2>
        </Reveal>
        <Reveal index={1}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <MagneticLink to="/register" className={primaryCta}>
              Create a workspace
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </MagneticLink>
            <Link to="/login" className={secondaryCta}>
              Sign in
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function MarketingFooter() {
  return (
    <footer className="border-t border-border-default/70">
      <div className="mx-auto flex max-w-[1180px] flex-col items-center gap-3 px-5 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2 text-secondary">
          <ContourMark size={18} />
          <span className="font-display text-body-medium text-primary">Contour</span>
        </div>
        <p className="text-meta text-muted">
          &copy; {new Date().getFullYear()} Contour. A Kanban board for small teams.
        </p>
      </div>
    </footer>
  );
}

export function HomePage() {
  return (
    <div className="bg-contour-canvas min-h-screen">
      <ScrollProgress />
      <MarketingNav />
      <main>
        <Hero />
        <HierarchySection />
        <FeatureSection />
        <ClosingCta />
      </main>
      <MarketingFooter />
    </div>
  );
}

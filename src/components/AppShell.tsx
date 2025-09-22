import type { ReactNode } from 'react';

interface AppShellProps {
  toolbar: ReactNode;
  sidebar: ReactNode;
  map: ReactNode;
}

const AppShell = ({ toolbar, sidebar, map }: AppShellProps) => (
  <div className="flex h-full flex-col bg-slate-950 text-slate-50">
    <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3">
        <h1 className="text-lg font-semibold tracking-tight">Miyako Water Planner</h1>
        <div className="flex-1" />
        {toolbar}
      </div>
    </header>
    <main className="flex flex-1 overflow-hidden">
      <aside className="w-96 shrink-0 border-r border-slate-800 bg-slate-900/50">
        <div className="h-full overflow-y-auto px-4 py-4">
          {sidebar}
        </div>
      </aside>
      <section className="flex-1">{map}</section>
    </main>
  </div>
);

export default AppShell;

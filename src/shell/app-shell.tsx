import { lazy, Suspense } from 'react'
import { cn } from '@/lib/utils'
import { BlankView } from '@/views/blank-view'
import { DemandasView } from '@/views/demandas-view'
import { useMedia } from '@/lib/use-media'
import { useVault } from '@/vault/vault-context'
import { CommitSheet, WriteToast } from '@/write/commit-sheet'
import { WriterProvider } from '@/write/writer'
import { useNav } from './nav'
import { notePathOf, viewPathOf, type NavId } from './nav-ids'
import { BottomNav, MOBILE, MobileItemBar, Swipeable } from './mobile'
import { Palette } from './palette'
import { Sidebar } from './sidebar'
import { Tabs } from './tabs'
import { TopBar } from './top-bar'

// Views carregadas sob demanda: o pacote inicial fica com o shell, o índice e a sincronização.
const PainelView = lazy(() =>
  import('@/views/painel-view').then((m) => ({ default: m.PainelView })),
)
const KanbanView = lazy(() =>
  import('@/views/kanban-view').then((m) => ({ default: m.KanbanView })),
)
const ArquivosView = lazy(() =>
  import('@/views/arquivos-view').then((m) => ({ default: m.ArquivosView })),
)
const NoteView = lazy(() => import('@/views/note-view').then((m) => ({ default: m.NoteView })))
const CustomView = lazy(() =>
  import('@/views/custom/custom-view').then((m) => ({ default: m.CustomView })),
)

function Loading() {
  return (
    <p className="p-10 label-caps" role="status">
      Abrindo…
    </p>
  )
}

function CurrentView({ id }: { id: NavId | null }) {
  const { index, loading } = useVault()
  if (!index) {
    return (
      <p className="p-10 label-caps" role="status">
        {loading ? 'Montando o índice…' : 'Sincronize para ler o vault.'}
      </p>
    )
  }
  if (!id) return <BlankView />
  if (id === 'painel') return <PainelView />
  if (id === 'kanban') return <KanbanView />
  if (id === 'demandas') return <DemandasView />
  if (id === 'arquivos') return <ArquivosView />
  const vpath = viewPathOf(id)
  if (vpath) return <CustomView key={vpath} path={vpath} />
  const path = notePathOf(id)
  return path ? <NoteView key={path} path={path} /> : <BlankView />
}

/** Estrutura do app (VO-DS001): topo, sidebar por entidade, abas e conteúdo; gaveta abaixo de 780px. */
export function AppShell({ onAddWorkspace }: { onAddWorkspace: () => void }) {
  const { current, sidebarOpen, setSidebarOpen } = useNav()
  const mobile = useMedia(MOBILE)
  return (
    <WriterProvider>
      <div
        className={cn(
          'grid h-dvh overflow-hidden',
          mobile ? 'grid-rows-[52px_minmax(0,1fr)_auto]' : 'grid-rows-[52px_minmax(0,1fr)]',
        )}
      >
        <TopBar onAddWorkspace={onAddWorkspace} />
        <div className="relative grid min-h-0 grid-cols-[minmax(0,1fr)] min-[780px]:grid-cols-[248px_minmax(0,1fr)]">
          <div
            className={cn(
              'absolute inset-y-0 left-0 z-30 w-[min(300px,86%)] -translate-x-full shadow-layer transition-transform duration-200 motion-reduce:transition-none min-[780px]:static min-[780px]:z-auto min-[780px]:w-auto min-[780px]:translate-x-0 min-[780px]:shadow-none',
              sidebarOpen && 'translate-x-0',
            )}
          >
            <Sidebar />
          </div>
          {sidebarOpen && (
            <button
              className="absolute inset-0 z-20 bg-black/40 min-[780px]:hidden"
              aria-label="Fechar navegação"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <main className="grid min-h-0 min-w-0 grid-rows-[38px_minmax(0,1fr)]">
            {mobile ? <MobileItemBar /> : <Tabs />}
            <Swipeable enabled={mobile}>
              <Suspense fallback={<Loading />}>
                <CurrentView id={current} />
              </Suspense>
            </Swipeable>
          </main>
        </div>
        {mobile && <BottomNav />}
        <Palette />
        <CommitSheet />
        <WriteToast />
      </div>
    </WriterProvider>
  )
}

import { Button } from '@/components/ui/button'
import { useNav } from '@/shell/nav'

export function BlankView() {
  const { open, setPaletteOpen } = useNav()
  return (
    <div
      className="grid h-full content-center justify-items-center gap-3.5 p-10 text-center text-faint"
      data-testid="blank"
    >
      <b className="text-[15px] text-strong">Nenhuma aba aberta</b>
      <span>Abra algo pela sidebar ou pela busca.</span>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={() => open('painel')}>Painel</Button>
        <Button onClick={() => open('kanban')}>Kanban</Button>
        <Button onClick={() => setPaletteOpen(true)}>Buscar ⌘K</Button>
      </div>
    </div>
  )
}

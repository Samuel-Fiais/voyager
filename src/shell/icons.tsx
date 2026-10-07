const PATHS = {
  painel: (
    <>
      <rect x="1.5" y="1.5" width="5" height="5" />
      <rect x="9.5" y="1.5" width="5" height="5" />
      <rect x="1.5" y="9.5" width="5" height="5" />
      <rect x="9.5" y="9.5" width="5" height="5" />
    </>
  ),
  kanban: (
    <>
      <rect x="1.5" y="1.5" width="3.5" height="13" />
      <rect x="6.25" y="1.5" width="3.5" height="9" />
      <rect x="11" y="1.5" width="3.5" height="11" />
    </>
  ),
  demandas: (
    <>
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 4.5v4l2.5 1.5" />
    </>
  ),
  arquivos: <path d="M1.5 3.5h5l1.5 1.5h6.5v8.5h-13z" />,
}

export function ViewIcon({ name }: { name: keyof typeof PATHS }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      aria-hidden="true"
      className="shrink-0"
    >
      {PATHS[name]}
    </svg>
  )
}

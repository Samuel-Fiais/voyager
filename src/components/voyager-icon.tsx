import type { SVGProps } from 'react'

/** Ícone "Gravidade assistida" (VO-DS001): planeta, trajetória e a sonda em vermelho NASA. */
export function VoyagerIcon({ size = 22, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <circle cx="8.4" cy="9.4" r="3.9" fill="var(--vy-strong)" />
      <path
        d="M2 21.2 C11.5 21.6 17.8 17 19 7.6"
        fill="none"
        stroke="var(--vy-strong)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="19.6" cy="4.6" r="2.3" fill="var(--vy-nasa)" />
    </svg>
  )
}

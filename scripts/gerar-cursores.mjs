// Gera src/cursors.css: o cursor do Voyager (seta e mãos clássicas, sólidas, com toque espacial) em SVG inline, nos dois temas.
// Rode `node scripts/gerar-cursores.mjs` depois de mexer nos desenhos ou nas cores.
import { writeFileSync } from 'node:fs'

const SIZE = 32
const THEMES = {
  dark: { ink: '#f2f1ec', halo: '#0b0b0c', nasa: '#fc3d21' },
  light: { ink: '#0b0b0c', halo: '#ffffff', nasa: '#e0301b' },
}

const solid = (d) => `<path fill-rule="evenodd" d="${d}"/>`

// Estrela de quatro pontas: o toque espacial dos cursores clássicos.
function star(cx, cy, r, k = 0.3) {
  const i = r * k
  const pts = [
    [cx, cy - r],
    [cx + i, cy - i],
    [cx + r, cy],
    [cx + i, cy + i],
    [cx, cy + r],
    [cx - i, cy + i],
    [cx - r, cy],
    [cx - i, cy - i],
  ]
  return `<polygon points="${pts.map((q) => q.join(',')).join(' ')}"/>`
}

const ARROW = solid('M5 2 L5 25 L10.5 19.8 L14.4 28.6 L18.6 26.7 L14.8 18.2 L22.5 18.2 Z')

// Cada desenho tem partes preenchidas (fill) e traços (stroke), com halo na cor oposta para ler
// em qualquer fundo. {ink} e {halo} viram as cores do tema.
const SHAPES = {
  // Seta clássica com uma estrela no canto.
  default: { hot: '5 2', fill: [ARROW, star(26.5, 24.5, 5)] },
  // Mão com o indicador levantado e uma estrela.
  pointer: {
    hot: '13 3',
    fill: [
      solid(
        'M11 5.2 A2.2 2.2 0 0 1 15.4 5.2 V12.6 A1.8 1.8 0 0 1 19 12.6 V13.4 A1.8 1.8 0 0 1 22.6 13.4 V14.4 A1.8 1.8 0 0 1 26.2 14.4 V22 C26.2 26 23.5 28.5 20 28.5 H16.5 C14 28.5 12.5 27.3 11.2 25.6 L6 19 C5.2 18 5.4 16.6 6.6 16 C7.7 15.4 8.8 15.8 9.6 16.6 L11 18 Z',
      ),
      '<path d="M19 14 V19 M22.6 15 V19" stroke="{halo}" stroke-width="1.3" fill="none"/>',
      star(25.5, 5.5, 4.6),
    ],
  },
  // Mão aberta: pronta para pegar.
  grab: {
    hot: '16 16',
    fill: [
      solid(
        'M9.5 10.7 A1.7 1.7 0 0 1 12.9 10.7 V7.7 A1.7 1.7 0 0 1 16.3 7.7 V7.2 A1.7 1.7 0 0 1 19.7 7.2 V9.2 A1.7 1.7 0 0 1 23.1 9.2 V19 C23.1 24 21 27.5 17 27.5 H15 C12 27.5 10.5 26 9 23.5 L5.5 18.2 C5 17 6 16 7.2 16.4 C8.2 16.7 9.5 18.5 9.5 18.5 Z',
      ),
      '<path d="M12.9 12 V17 M16.3 11 V17 M19.7 11 V17" stroke="{halo}" stroke-width="1.3" fill="none"/>',
    ],
  },
  // Mão fechada: segurando.
  grabbing: {
    hot: '16 16',
    fill: [
      solid(
        'M8 14.6 A2 2 0 0 1 12 14.6 A2 2 0 0 1 16 14.6 A2 2 0 0 1 20 14.6 A2 2 0 0 1 24 14.6 V21 C24 25 21.5 27.5 18 27.5 H14 C10.5 27.5 8 25 8 21 Z',
      ),
      '<path d="M12 15.5 V19 M16 15.5 V19 M20 15.5 V19" stroke="{halo}" stroke-width="1.3" fill="none"/>',
    ],
  },
  // Escrita: I clássico, sólido, com uma estrela.
  text: {
    hot: '16 16',
    fill: [
      solid('M10.5 4 H21.5 V6.5 H17.2 V25.5 H21.5 V28 H10.5 V25.5 H14.8 V6.5 H10.5 Z'),
      star(26.5, 7, 3.4),
    ],
  },
  // Seta com um planeta de anel: trabalhando em segundo plano.
  wait: {
    hot: '5 2',
    fill: [
      ARROW,
      '<g transform="rotate(-20 26.5 25.5)"><ellipse cx="26.5" cy="25.5" rx="5.3" ry="1.9" fill="none" stroke="{ink}" stroke-width="1.8"/></g>',
      '<circle cx="26.5" cy="25.5" r="3.3" stroke="{halo}" stroke-width="1.8"/>',
      '<g transform="rotate(-20 26.5 25.5)"><path d="M21.2 25.5 A5.3 1.9 0 0 0 31.8 25.5" fill="none" stroke="{ink}" stroke-width="1.8"/></g>',
    ],
  },
  // Bloqueado (único uso de vermelho, como no resto do padrão).
  'not-allowed': {
    hot: '16 16',
    red: true,
    stroke: [
      [`<circle cx="16" cy="16" r="10" fill="none"/>`, 4],
      [`<line x1="9" y1="9" x2="23" y2="23"/>`, 4],
    ],
  },
}

function svg(name, theme) {
  const t = THEMES[theme]
  const sh = SHAPES[name]
  const ink = sh.red ? t.nasa : t.ink
  const fills = (sh.fill ?? []).join('')
  const strokes = sh.stroke ?? []
  const layer = (color, halo) =>
    `<g fill="${color}" stroke="${halo ? color : 'none'}" stroke-width="3" stroke-linejoin="round">${fills.replaceAll('{ink}', color).replaceAll('{halo}', t.halo)}</g>` +
    strokes
      .map(
        ([el, w]) =>
          `<g stroke="${color}" stroke-width="${w + (halo ? 3 : 0)}" stroke-linecap="round" fill="none">${el}</g>`,
      )
      .join('')
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">${layer(t.halo, true)}${layer(ink, false)}</svg>`
  return xml.replace(/"/g, "'").replace(/</g, '%3C').replace(/>/g, '%3E').replace(/#/g, '%23')
}

const FALLBACK = {
  default: 'default',
  pointer: 'pointer',
  grab: 'grab',
  grabbing: 'grabbing',
  wait: 'wait',
  text: 'text',
  'not-allowed': 'not-allowed',
}

const vars = (theme, indent) =>
  Object.keys(SHAPES)
    .map(
      (n) =>
        `${indent}--vy-cursor-${n}: url("data:image/svg+xml,${svg(n, theme)}") ${SHAPES[n].hot}, ${FALLBACK[n]};`,
    )
    .join('\n')

const css = `/* Gerado por scripts/gerar-cursores.mjs — não edite à mão. */
@media (hover: hover) and (pointer: fine) and (forced-colors: none) {
  :root {
${vars('dark', '    ')}
  }
  :root[data-theme='light'] {
${vars('light', '    ')}
  }
  @media (prefers-color-scheme: light) {
    :root:not([data-theme]) {
${vars('light', '      ')}
    }
  }

  /* Sem @layer de propósito: precisa vencer os utilitários cursor-* do Tailwind. */
  html {
    cursor: var(--vy-cursor-default);
  }
  a[href],
  button,
  summary,
  label[for],
  select,
  [role='button'],
  [role='tab'],
  [role='menuitem'],
  [class~='cursor-pointer'] {
    cursor: var(--vy-cursor-pointer);
  }
  [class~='cursor-grab'] {
    cursor: var(--vy-cursor-grab);
  }
  [class~='cursor-grab']:active,
  [class~='cursor-grabbing'] {
    cursor: var(--vy-cursor-grabbing);
  }
  input:not([type='checkbox'], [type='radio'], [type='button'], [type='submit'], [type='range']),
  textarea,
  [contenteditable]:not([contenteditable='false']),
  .cm-content {
    cursor: var(--vy-cursor-text);
  }
  [aria-busy='true'] {
    cursor: var(--vy-cursor-wait);
  }
  :disabled,
  [aria-disabled='true'] {
    cursor: var(--vy-cursor-not-allowed);
  }
}
`
writeFileSync(new URL('../src/cursors.css', import.meta.url), css)

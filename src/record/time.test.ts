import { describe, expect, it } from 'vitest'
import { formatGap, formatSpan } from './time'

describe('intervalos da trajetória', () => {
  it('formata o tempo desde o registro anterior', () => {
    expect(formatGap(null)).toBe('início da trajetória')
    expect(formatGap(0)).toBe('no mesmo minuto do anterior')
    expect(formatGap(38 * 60_000)).toBe('+38 min depois do anterior')
    expect(formatGap(65 * 60_000)).toBe('+1h05 depois do anterior')
    expect(formatGap((2 * 24 + 3) * 3_600_000)).toBe('+2 d 3 h depois do anterior')
    expect(formatSpan(116 * 60_000)).toBe('1h56')
    expect(formatSpan(5 * 24 * 3_600_000)).toBe('5 dias')
  })
})

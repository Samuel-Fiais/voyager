/** Diff de linhas (LCS) para a folha de confirmação: só as linhas removidas (`- `) e acrescentadas (`+ `). */
export function lineDiff(before: string, after: string, max = 400): string[] {
  const A = before.split('\n')
  const B = after.split('\n')
  // corta prefixo e sufixo iguais para manter a tabela pequena
  let start = 0
  while (start < A.length && start < B.length && A[start] === B[start]) start++
  let endA = A.length
  let endB = B.length
  while (endA > start && endB > start && A[endA - 1] === B[endB - 1]) {
    endA--
    endB--
  }
  const a = A.slice(start, endA)
  const b = B.slice(start, endB)
  if (a.length * b.length > 4_000_000)
    return [...a.map((l) => `- ${l}`), ...b.map((l) => `+ ${l}`)].slice(0, max)
  const n = a.length
  const m = b.length
  const dp: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  }
  const out: string[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) out.push(`- ${a[i++]}`)
    else out.push(`+ ${b[j++]}`)
  }
  while (i < n) out.push(`- ${a[i++]}`)
  while (j < m) out.push(`+ ${b[j++]}`)
  return out.slice(0, max)
}

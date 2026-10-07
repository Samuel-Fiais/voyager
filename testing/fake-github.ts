// GitHub simulado em memória para os testes (Vitest e Playwright): REST de leitura e escrita
// de dados do Git, GraphQL de blobs e OAuth/usuário. Não depende de Node nem do navegador.

type Content = string | Uint8Array

export interface FakeResponse {
  status: number
  body?: unknown
  bytes?: Uint8Array
  headers?: Record<string, string>
}

interface CommitObject {
  sha: string
  tree: string
  parents: string[]
  message: string
}

const enc = new TextEncoder()

function toBytes(c: Content): Uint8Array {
  return typeof c === 'string' ? enc.encode(c) : c
}

async function sha1(data: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', data as BufferSource)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

/** SHA de blob no formato do Git: sha1("blob <tamanho>\0" + conteúdo). */
export async function gitBlobSha(content: Content): Promise<string> {
  const bytes = toBytes(content)
  const header = enc.encode(`blob ${bytes.length}\0`)
  const all = new Uint8Array(header.length + bytes.length)
  all.set(header)
  all.set(bytes, header.length)
  return sha1(all)
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

function isBinary(bytes: Uint8Array): boolean {
  return bytes.subarray(0, 8000).includes(0) || !isUtf8(bytes)
}

function isUtf8(bytes: Uint8Array): boolean {
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    return true
  } catch {
    return false
  }
}

export class FakeGitHub {
  readonly owner: string
  readonly repo: string
  readonly user = { login: 'samuel-teste', name: 'Samuel Fiais', avatar_url: '' }
  readonly blobs = new Map<string, Uint8Array>()
  readonly trees = new Map<string, Map<string, string>>()
  readonly commits = new Map<string, CommitObject>()
  readonly refs = new Map<string, string>()
  /** Registro das chamadas (método e caminho), para as asserções dos testes. */
  readonly calls: string[] = []
  /** Token aceito; outro token recebe 401. */
  token = 'gho_teste'
  revoked = false

  constructor(owner = 'samuel-teste', repo = 'vault-sintetico') {
    this.owner = owner
    this.repo = repo
  }

  static async create(
    files: Record<string, Content>,
    opts: { owner?: string; repo?: string; branches?: string[] } = {},
  ) {
    const gh = new FakeGitHub(opts.owner, opts.repo)
    const tree = new Map<string, string>()
    for (const [path, content] of Object.entries(files)) tree.set(path, await gh.putBlob(content))
    const treeSha = await gh.putTree(tree)
    const commit = await gh.putCommit(treeSha, [], 'commit inicial')
    for (const b of opts.branches ?? ['main']) gh.refs.set(b, commit)
    return gh
  }

  async putBlob(content: Content): Promise<string> {
    const bytes = toBytes(content)
    const sha = await gitBlobSha(bytes)
    this.blobs.set(sha, bytes)
    return sha
  }

  async putTree(entries: Map<string, string>): Promise<string> {
    const sorted = [...entries.entries()].sort(([a], [b]) => (a < b ? -1 : 1))
    const sha = await sha1(enc.encode(`tree ${JSON.stringify(sorted)}`))
    this.trees.set(sha, new Map(sorted))
    return sha
  }

  async putCommit(tree: string, parents: string[], message: string): Promise<string> {
    const sha = await sha1(
      enc.encode(`commit ${tree} ${parents.join(',')} ${message} ${this.commits.size}`),
    )
    this.commits.set(sha, { sha, tree, parents, message })
    return sha
  }

  head(branch = 'main'): CommitObject {
    return this.commits.get(this.refs.get(branch)!)!
  }

  /** Conteúdo de um arquivo na ponta da branch (texto), ou undefined. */
  file(path: string, branch = 'main'): string | undefined {
    const sha = this.trees.get(this.head(branch).tree)!.get(path)
    return sha ? new TextDecoder().decode(this.blobs.get(sha)) : undefined
  }

  /** Simula um commit feito fora do Voyager (agente, Obsidian). null apaga o arquivo. */
  async externalCommit(
    changes: Record<string, Content | null>,
    message = 'commit externo',
    branch = 'main',
  ) {
    const tree = new Map(this.trees.get(this.head(branch).tree)!)
    for (const [path, content] of Object.entries(changes)) {
      if (content === null) tree.delete(path)
      else tree.set(path, await this.putBlob(content))
    }
    const commit = await this.putCommit(await this.putTree(tree), [this.head(branch).sha], message)
    this.refs.set(branch, commit)
    return commit
  }

  private repoInfo() {
    return {
      id: 1,
      full_name: `${this.owner}/${this.repo}`,
      name: this.repo,
      owner: { login: this.owner },
      private: true,
      default_branch: 'main',
      pushed_at: null,
      description: 'vault sintético',
    }
  }

  async handle(
    method: string,
    url: string,
    body?: string,
    headers: Record<string, string> = {},
  ): Promise<FakeResponse> {
    const u = new URL(url)
    const path = u.pathname
    this.calls.push(`${method} ${path}`)
    const auth = headers.authorization ?? headers.Authorization ?? ''
    if (path.startsWith('/applications/')) return { status: 204 }
    if (auth !== `Bearer ${this.token}` || this.revoked) {
      return { status: 401, body: { message: 'Bad credentials' } }
    }
    const json = body ? (JSON.parse(body) as Record<string, unknown>) : {}
    const base = `/repos/${this.owner}/${this.repo}`

    if (method === 'GET' && path === '/user') return { status: 200, body: this.user }
    if (method === 'GET' && path === '/user/repos') return { status: 200, body: [this.repoInfo()] }
    if (method === 'POST' && path === '/graphql')
      return { status: 200, body: this.graphql(String(json.query)) }
    if (!path.startsWith(base)) return { status: 404, body: { message: 'Not Found' } }
    const rest = path.slice(base.length)

    if (method === 'GET' && rest === '') return { status: 200, body: this.repoInfo() }
    if (method === 'GET' && rest === '/branches') {
      return { status: 200, body: [...this.refs.keys()].map((name) => ({ name })) }
    }
    let m = rest.match(/^\/branches\/(.+)$/)
    if (method === 'GET' && m) {
      const sha = this.refs.get(decodeURIComponent(m[1]))
      if (!sha) return { status: 404, body: { message: 'Branch not found' } }
      const c = this.commits.get(sha)!
      return {
        status: 200,
        body: { name: m[1], commit: { sha, commit: { tree: { sha: c.tree } } } },
      }
    }
    m = rest.match(/^\/git\/trees\/([0-9a-f]+)$/)
    if (method === 'GET' && m) {
      const tree = this.trees.get(m[1])
      if (!tree) return { status: 404, body: { message: 'Not Found' } }
      return {
        status: 200,
        body: {
          sha: m[1],
          truncated: false,
          tree: [...tree].map(([p, sha]) => ({
            path: p,
            mode: '100644',
            type: 'blob',
            sha,
            size: this.blobs.get(sha)!.length,
          })),
        },
      }
    }
    m = rest.match(/^\/git\/blobs\/([0-9a-f]+)$/)
    if (method === 'GET' && m) {
      const bytes = this.blobs.get(m[1])
      if (!bytes) return { status: 404, body: { message: 'Not Found' } }
      return { status: 200, bytes, headers: { 'content-type': 'application/octet-stream' } }
    }
    m = rest.match(/^\/git\/commits\/([0-9a-f]+)$/)
    if (method === 'GET' && m) {
      const c = this.commits.get(m[1])
      if (!c) return { status: 404, body: { message: 'Not Found' } }
      return {
        status: 200,
        body: {
          sha: c.sha,
          tree: { sha: c.tree },
          parents: c.parents.map((sha) => ({ sha })),
          message: c.message,
        },
      }
    }
    if (method === 'POST' && rest === '/git/blobs') {
      const content =
        json.encoding === 'base64' ? base64ToBytes(String(json.content)) : String(json.content)
      return { status: 201, body: { sha: await this.putBlob(content) } }
    }
    if (method === 'POST' && rest === '/git/trees') {
      const baseTree = json.base_tree
        ? this.trees.get(String(json.base_tree))
        : new Map<string, string>()
      if (!baseTree) return { status: 422, body: { message: 'base_tree inválida' } }
      const tree = new Map(baseTree)
      for (const e of json.tree as { path: string; sha: string | null }[]) {
        if (e.sha === null) tree.delete(e.path)
        else tree.set(e.path, e.sha)
      }
      return { status: 201, body: { sha: await this.putTree(tree) } }
    }
    if (method === 'POST' && rest === '/git/commits') {
      const sha = await this.putCommit(
        String(json.tree),
        json.parents as string[],
        String(json.message),
      )
      return { status: 201, body: { sha, tree: { sha: json.tree } } }
    }
    m = rest.match(/^\/git\/refs\/heads\/(.+)$/)
    if (method === 'PATCH' && m) {
      const branch = decodeURIComponent(m[1])
      const current = this.refs.get(branch)
      const next = String(json.sha)
      const commit = this.commits.get(next)
      if (!current || !commit) return { status: 422, body: { message: 'Reference does not exist' } }
      if (!json.force && !commit.parents.includes(current) && next !== current) {
        return { status: 422, body: { message: 'Update is not a fast forward' } }
      }
      this.refs.set(branch, next)
      return { status: 200, body: { ref: `refs/heads/${branch}`, object: { sha: next } } }
    }
    return { status: 404, body: { message: `Fake: rota não simulada ${method} ${rest}` } }
  }

  private graphql(query: string) {
    const repository: Record<string, unknown> = {}
    for (const m of query.matchAll(/(\w+): object\(oid: "([0-9a-f]+)"\)/g)) {
      const bytes = this.blobs.get(m[2])
      if (!bytes) repository[m[1]] = null
      else {
        const binary = isBinary(bytes)
        repository[m[1]] = {
          text: binary ? null : new TextDecoder().decode(bytes),
          isTruncated: false,
          isBinary: binary,
        }
      }
    }
    return { data: { repository } }
  }

  /** fetch compatível para usar no lugar do global nos testes de unidade. */
  fetch = async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const headers: Record<string, string> = {}
    new Headers(init.headers).forEach((v, k) => (headers[k] = v))
    const res = await this.handle(
      init.method ?? 'GET',
      url,
      init.body ? String(init.body) : undefined,
      headers,
    )
    if (res.bytes)
      return new Response(res.bytes as BodyInit, { status: res.status, headers: res.headers })
    return new Response(res.status === 204 ? null : JSON.stringify(res.body), {
      status: res.status,
      headers: { 'content-type': 'application/json', ...res.headers },
    })
  }
}

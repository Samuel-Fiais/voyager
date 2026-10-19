// Cliente mínimo da API REST do GitHub, usado pelo navegador com o token do OAuth App.

export const GITHUB_API = 'https://api.github.com'

export class GitHubError extends Error {
  readonly status: number
  readonly rateLimited: boolean
  constructor(status: number, message: string, rateLimited = false) {
    super(message)
    this.name = 'GitHubError'
    this.status = status
    this.rateLimited = rateLimited
  }
}

export interface GitHubUser {
  login: string
  name: string | null
  avatar_url: string
}

export interface GitHubRepo {
  id: number
  full_name: string
  name: string
  owner: { login: string }
  private: boolean
  default_branch: string
  pushed_at: string | null
  description: string | null
}

export class GitHubClient {
  readonly token: string
  private readonly fetchImpl: typeof fetch

  constructor(token: string, fetchImpl: typeof fetch = (...args) => fetch(...args)) {
    this.token = token
    this.fetchImpl = fetchImpl
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await this.fetchImpl(path.startsWith('http') ? path : `${GITHUB_API}${path}`, {
      ...init,
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${this.token}`,
        'x-github-api-version': '2022-11-28',
        ...(init.body ? { 'content-type': 'application/json' } : {}),
        ...init.headers,
      },
    })
    if (!res.ok) {
      const rateLimited =
        (res.status === 403 || res.status === 429) &&
        res.headers.get('x-ratelimit-remaining') === '0'
      let message = res.statusText
      try {
        message = ((await res.json()) as { message?: string }).message ?? message
      } catch {
        // corpo sem JSON
      }
      throw new GitHubError(res.status, message, rateLimited)
    }
    if (res.status === 204) return undefined as T
    return (await res.json()) as T
  }

  user() {
    return this.request<GitHubUser>('/user')
  }

  /** Repositórios a que a conta tem acesso, do mais recente ao mais antigo. */
  async repos(): Promise<GitHubRepo[]> {
    const all: GitHubRepo[] = []
    for (let page = 1; page <= 10; page++) {
      const batch = await this.request<GitHubRepo[]>(
        `/user/repos?per_page=100&sort=pushed&affiliation=owner,collaborator,organization_member&page=${page}`,
      )
      all.push(...batch)
      if (batch.length < 100) break
    }
    return all
  }
}

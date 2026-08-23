import { request as httpsRequest } from 'node:https'
import { HttpsProxyAgent } from 'https-proxy-agent'

// 服务端外部请求统一入口：超时 + JSON 解析 + 失败返回 null。
// Node 的 fetch 默认不读 Windows 系统代理，因此这里用 https.request 显式挂载 HttpsProxyAgent。
// 只有命中 PROXY_HOSTS 白名单的域名才走代理，其余（GitHub/Steam/WakaTime）保持直连，
// 避免本地代理不可用时连累本可直连的外部服务；localhost 不在白名单内天然跳过。

const PROXY_URL =
  import.meta.env.HTTPS_PROXY ||
  import.meta.env.HTTP_PROXY ||
  process.env.HTTPS_PROXY ||
  process.env.HTTP_PROXY ||
  ''

const PROXY_HOSTS = (
  import.meta.env.PROXY_HOSTS ||
  process.env.PROXY_HOSTS ||
  'api.bgm.tv'
)
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

const proxyAgent = PROXY_URL ? new HttpsProxyAgent(PROXY_URL) : undefined

function shouldProxy(hostname: string): boolean {
  if (!proxyAgent) return false
  const h = hostname.toLowerCase()
  return PROXY_HOSTS.some((allowed) => h === allowed || h.endsWith('.' + allowed))
}

export interface FetchJsonOptions {
  headers?: Record<string, string>
  method?: string
}

export async function fetchJson<T>(
  url: string,
  options: FetchJsonOptions = {},
  timeoutMs = 15000,
): Promise<T | null> {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch (error) {
    console.warn('[integrations] 非法 URL: ' + url, error instanceof Error ? error.message : error)
    return null
  }

  return await new Promise<T | null>((resolve) => {
    let settled = false
    const done = (value: T | null) => {
      if (settled) return
      settled = true
      resolve(value)
    }

    const req = httpsRequest(
      {
        hostname: parsed.hostname,
        port: parsed.port ? Number(parsed.port) : 443,
        path: parsed.pathname + parsed.search,
        method: options.method ?? 'GET',
        headers: options.headers,
        agent: shouldProxy(parsed.hostname)
          ? (proxyAgent as unknown as import('node:https').Agent)
          : undefined,
      },
      (res) => {
        let body = ''
        res.setEncoding('utf8')
        res.on('data', (chunk: string) => {
          body += chunk
        })
        res.on('end', () => {
          const status = res.statusCode ?? 0
          if (status >= 200 && status < 300) {
            try {
              done(JSON.parse(body) as T)
            } catch (error) {
              console.warn('[integrations] JSON 解析失败: ' + url, error instanceof Error ? error.message : error)
              done(null)
            }
          } else {
            console.warn('[integrations] 请求失败 ' + status + ': ' + url)
            done(null)
          }
        })
      },
    )

    req.setTimeout(timeoutMs, () => {
      req.destroy()
      console.warn('[integrations] 请求超时 ' + timeoutMs + 'ms: ' + url)
      done(null)
    })

    req.on('error', (error) => {
      console.warn('[integrations] 请求异常: ' + url, error instanceof Error ? error.message : error)
      done(null)
    })

    req.end()
  })
}

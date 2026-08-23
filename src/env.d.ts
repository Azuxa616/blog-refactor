/// <reference types="astro/client" />

// 外部数据集成所需的环境变量声明（仅服务端读取）
interface ImportMetaEnv {
  readonly WAKATIME_API_KEY?: string
  readonly STEAM_API_KEY?: string
  readonly STEAM_ID?: string
  readonly BANGUMI_USERNAME?: string
  readonly GITHUB_TOKEN?: string
  readonly GITHUB_NAME?: string
  readonly HTTPS_PROXY?: string
  readonly HTTP_PROXY?: string
  readonly PROXY_HOSTS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
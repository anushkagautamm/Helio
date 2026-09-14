/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL for the Helio API. Defaults to '/api' (same-domain reverse proxy). */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

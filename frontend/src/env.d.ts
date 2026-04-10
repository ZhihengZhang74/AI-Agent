/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '@amap/amap-jsapi-loader' {
  interface AMapLoaderOptions {
    key: string
    version: string
    plugins?: string[]
  }
  const AMapLoader: {
    load(options: AMapLoaderOptions): Promise<any>
  }
  export default AMapLoader
}

interface ImportMetaEnv {
  readonly VITE_AMAP_JS_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
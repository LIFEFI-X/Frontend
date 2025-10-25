declare module 'postcss-px-to-viewport' {
  interface Options {
    viewportWidth?: number
    viewportHeight?: number
    unitPrecision?: number
    viewportUnit?: string
    selectorBlackList?: (string | RegExp)[]
    minPixelValue?: number
    mediaQuery?: boolean
    exclude?: RegExp[]
  }

  function postcssPxToViewport(options?: Options): any
  export = postcssPxToViewport
} 
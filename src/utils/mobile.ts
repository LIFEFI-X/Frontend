/**
 * Mobile terminal adaptation tools
 */
export class MobileUtils {
  /**
   * Determine whether it is a mobile device
   */
  static isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  }

  /**
   * Determine whether it is an iOS device
   */
  static isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent)
  }

  /**
   * Determine whether it is an Android device
   */
  static isAndroid(): boolean {
    return /Android/.test(navigator.userAgent)
  }

  /**
   * Determine whether it is a WeChat environment
   */
  static isWeChat(): boolean {
    return /MicroMessenger/i.test(navigator.userAgent)
  }

  /**
   * Get screen information
   */
  static getScreenInfo() {
    return {
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      devicePixelRatio: window.devicePixelRatio || 1
    }
  }

  /**
   * Get viewport information
   */
  static getViewportInfo() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      documentWidth: document.documentElement.clientWidth,
      documentHeight: document.documentElement.clientHeight
    }
  }

  /**
   * Prevent double-click to zoom on mobile
   */
  static preventZoom() {
    document.addEventListener('touchstart', function (event) {
      if (event.touches.length > 1) {
        event.preventDefault()
      }
    })

    let lastTouchEnd = 0
    document.addEventListener('touchend', function (event) {
      const now = new Date().getTime()
      if (now - lastTouchEnd <= 300) {
        event.preventDefault()
      }
      lastTouchEnd = now
    }, false)
  }

  // Remove duplicate onOrientationChange method

  /**
   * Set viewport
   */
  static setViewport(
    width = 'device-width',
    initialScale = 1,
    maximumScale = 1,
    userScalable = 'no'
  ) {
    let viewport = document.querySelector('meta[name="viewport"]')
    if (!viewport) {
      viewport = document.createElement('meta')
      viewport.setAttribute('name', 'viewport')
      document.head.appendChild(viewport)
    }
    
    const content = `width=${width}, initial-scale=${initialScale}, maximum-scale=${maximumScale}, user-scalable=${userScalable}`
    viewport.setAttribute('content', content)
  }

  // Removed duplicate getSafeAreaInsets method (keep the number-returning version below)

  /**
   * Get status bar height (iOS)
   */
  static getStatusBarHeight(): number {
    if (this.isIOS()) {
      // Use the getSafeAreaInsets method defined below
      const style = getComputedStyle(document.documentElement)
      const safeAreaTop = style.getPropertyValue('--safe-area-inset-top')
      return parseInt(safeAreaTop) || 20
    }
    return 0
  }

  /**
   * Get the bottom safety area height
   */
  static getBottomSafeAreaHeight(): number {
    // Use the getSafeAreaInsets method defined below
    const style = getComputedStyle(document.documentElement)
    const safeAreaBottom = style.getPropertyValue('--safe-area-inset-bottom')
    return parseInt(safeAreaBottom) || 0
  }

  /**
   * Add mobile style class
   */
  static addMobileClass() {
    const html = document.documentElement
    if (this.isMobile()) {
      html.classList.add('mobile')
      if (this.isIOS()) {
        html.classList.add('ios')
      }
      if (this.isAndroid()) {
        html.classList.add('android')
      }
      if (this.isWeChat()) {
        html.classList.add('wechat')
      }
    } else {
      html.classList.add('desktop')
    }
  }

  /**
   * Detect if it is a touch device
   */
  static isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }

  /**
   * Get device pixel ratio
   */
  static getDevicePixelRatio(): number {
    return window.devicePixelRatio || 1
  }

  /**
   * Get viewport width
   */
  static getViewportWidth(): number {
    return window.innerWidth || document.documentElement.clientWidth
  }

  /**
   * Get viewport height
   */
  static getViewportHeight(): number {
    return window.innerHeight || document.documentElement.clientHeight
  }

  /**
   * Detection equipment direction
   */
  static getOrientation(): 'portrait' | 'landscape' {
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
  }

  /**
   * Listen for direction changes
   */
  static onOrientationChange(callback: (orientation: 'portrait' | 'landscape') => void): () => void {
    const handler = () => {
      callback(this.getOrientation())
    }
    
    window.addEventListener('orientationchange', handler)
    window.addEventListener('resize', handler)
    
    // Return cleaning function
    return () => {
      window.removeEventListener('orientationchange', handler)
      window.removeEventListener('resize', handler)
    }
  }

  /**
   * Set viewport meta tag
   */
  static setViewportMeta(content: string = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'): void {
    let viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement
    
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta')
      viewportMeta.name = 'viewport'
      document.head.appendChild(viewportMeta)
    }
    
    viewportMeta.content = content
  }

  /**
   * Get safe area
   */
  static getSafeAreaInsets(): {
    top: number
    right: number
    bottom: number
    left: number
  } {
    const style = getComputedStyle(document.documentElement)
    
    return {
      top: parseInt(style.getPropertyValue('--safe-area-inset-top')) || 0,
      right: parseInt(style.getPropertyValue('--safe-area-inset-right')) || 0,
      bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom')) || 0,
      left: parseInt(style.getPropertyValue('--safe-area-inset-left')) || 0
    }
  }
} 
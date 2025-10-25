import { message, notification, Modal, type NotificationConfig } from 'ant-design-vue'

/**
 * User interaction tool class
 * Provide a unified user interaction interface
 */
export class InteractionUtils {
  /**
   * Show success message
   */
  static success(content: string, duration: number = 3) {
    message.success(content, duration)
  }

  /**
   * Show error message
   */
  static error(content: string, duration: number = 3) {
    message.error(content, duration)
  }

  /**
   * Show warning message
   */
  static warning(content: string, duration: number = 3) {
    message.warning(content, duration)
  }

  /**
   * Show information message
   */
  static info(content: string, duration: number = 3) {
    message.info(content, duration)
  }

  /**
   * show loading status
   */
  static loading(content: string = 'Loading...', duration: number = 0) {
    return message.loading(content, duration)
  }

  /**
   * Show notification
   */
  static notify(options: NotificationConfig) {
    notification.open(options)
  }

  /**
   * Show success notification
   */
  static notifySuccess(title: string, description?: string) {
    notification.success({
      message: title,
      description,
      duration: 3
    })
  }

  /**
   * Show error notification
   */
  static notifyError(title: string, description?: string) {
    notification.error({
      message: title,
      description,
      duration: 5
    })
  }

  /**
   * Show confirmation dialog
   */
  static confirm(
    title: string,
    content?: string,
    onOk?: () => void,
    onCancel?: () => void
  ) {
    Modal.confirm({
      title,
      content,
      onOk,
      onCancel
    })
  }

  /**
   * Show information dialog
   */
  static alert(title: string, content?: string) {
    Modal.info({
      title,
      content
    })
  }

  /**
   * Tactile feedback (mobile)
   */
  static vibrate(pattern: number | number[] = 100) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }

  /**
   * Anti-shake function
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(this, args), wait)
    }
  }

  /**
   * Throttle function
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }
  }
} 
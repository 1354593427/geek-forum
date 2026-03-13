/**
 * 全局错误监控：window.onerror + unhandledrejection
 * 可后续接入 Sentry 等在此统一上报
 */

type ErrorPayload = {
  type: 'error' | 'unhandledrejection'
  message: string
  source?: string
  lineno?: number
  colno?: number
  stack?: string
  reason?: unknown
}

function capture(payload: ErrorPayload): void {
  if (typeof window === 'undefined') return
  console.error('[ErrorMonitor]', payload)
  // 可选：上报到 Sentry
  // if (window.Sentry) window.Sentry.captureException(new Error(payload.message), { extra: payload })
}

export function initErrorMonitor(): void {
  if (typeof window === 'undefined') return

  window.onerror = function (
    message: string | Event,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error
  ): boolean {
    capture({
      type: 'error',
      message: typeof message === 'string' ? message : (message as ErrorEvent).message,
      source,
      lineno,
      colno,
      stack: error?.stack,
    })
    return false
  }

  window.addEventListener('unhandledrejection', function (event: PromiseRejectionEvent): void {
    const reason = event.reason
    const message = reason instanceof Error ? reason.message : String(reason)
    const stack = reason instanceof Error ? reason.stack : undefined
    capture({ type: 'unhandledrejection', message, stack, reason })
  })
}

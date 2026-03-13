/**
 * 日志脱敏：避免输出 token、密码等敏感信息
 */

/**
 * 安全输出错误信息（脱敏）
 */
export function safeErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message
    const s = String(err)
    if (s.toLowerCase().includes('password') || s.toLowerCase().includes('token')) return 'Error (details hidden)'
    return s
}

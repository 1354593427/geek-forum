const AUTH_TOKEN_KEY = 'geek_forum_token'
const AUTH_USER_KEY = 'geek_forum_user'

export function getAuthToken(): string | null {
    try {
        return localStorage.getItem(AUTH_TOKEN_KEY)
    } catch {
        return null
    }
}

export function setAuthToken(token: string, username?: string): void {
    try {
        localStorage.setItem(AUTH_TOKEN_KEY, token)
        if (username) localStorage.setItem(AUTH_USER_KEY, username)
    } catch (e) {
        console.warn('[Auth] Failed to save token:', e)
    }
}

export function getAuthUsername(): string | null {
    try {
        return localStorage.getItem(AUTH_USER_KEY)
    } catch {
        return null
    }
}

export function clearAuthToken(): void {
    try {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        localStorage.removeItem(AUTH_USER_KEY)
    } catch { /* noop */ }
}

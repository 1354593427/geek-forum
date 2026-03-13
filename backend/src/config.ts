/**
 * 环境变量集中管理
 */
export const isProd = process.env.NODE_ENV === 'production'

export const config = {
    port: Number(process.env.PORT) || 3080,
    databasePath: process.env.DATABASE_PATH || '',
    adminUser: process.env.ADMIN_USER || '',
    adminPassword: process.env.ADMIN_PASSWORD || '',
    jwtSecret: process.env.JWT_SECRET || 'geek-forum-default-secret-change-in-production',
    jwtExp: process.env.JWT_EXP || '7d',
    gitAutoCommit: process.env.GIT_AUTO_COMMIT === '1' || process.env.GIT_AUTO_COMMIT?.toLowerCase() === 'true',
    corsOrigin: process.env.CORS_ORIGIN || '',
} as const

const DEFAULT_JWT = 'geek-forum-default-secret-change-in-production'
const MIN_PASSWORD_LEN = 8
const MIN_JWT_SECRET_LEN = 32

/**
 * 启动时校验敏感配置（生产环境更严格）
 */
export function validateConfig(): void {
    if (!isProd) return

    const warnings: string[] = []

    if (config.jwtSecret === DEFAULT_JWT || config.jwtSecret.length < MIN_JWT_SECRET_LEN) {
        warnings.push(
            `JWT_SECRET 未设置或过短（建议 >= ${MIN_JWT_SECRET_LEN} 字符），生产环境请务必修改`
        )
    }

    if (config.adminUser && config.adminPassword && config.adminPassword.length < MIN_PASSWORD_LEN) {
        warnings.push(`ADMIN_PASSWORD 过短（建议 >= ${MIN_PASSWORD_LEN} 字符）`)
    }

    if (config.adminUser && !config.adminPassword) {
        warnings.push('ADMIN_USER 已设置但 ADMIN_PASSWORD 为空')
    }

    if (warnings.length > 0) {
        console.warn('[Config] ⚠️ 生产环境配置建议：')
        warnings.forEach((w) => console.warn(`  - ${w}`))
    }
}

import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
    { ignores: ['dist/', 'node_modules/', 'posts/', 'public/'] },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    prettier,
    {
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'no-console': ['warn', { allow: ['warn', 'error'] }],
        },
    },
)

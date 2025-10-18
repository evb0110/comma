export default defineNuxtConfig({
    modules: ['@nuxt/eslint', '@nuxt/ui'],

    devtools: { enabled: true },

    css: ['~/assets/css/main.css'],

    routeRules: { '/api/**': { cors: true } },

    compatibilityDate: '2025-01-15',

    typescript: { typeCheck: true },

    eslint: {
        config: {
            stylistic: {
                indent: 4,
                quotes: 'single',
                semi: false,
                commaDangle: 'never',
            },
        },
    },
})

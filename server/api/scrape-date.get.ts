export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const commaUrl = typeof query.url === 'string' ? query.url : undefined

    if (!commaUrl) {
        throw createError({
            statusCode: 400,
            message: 'CoMMA URL is required',
        })
    }

    try {
        const html = await $fetch<string>(commaUrl, { responseType: 'text' })

        const dateMatch = html.match(/>\s*(\d{3,4}[–—-]\d{3,4})\s*</i)

        if (dateMatch && dateMatch[1]) {
            return {
                success: true,
                date: dateMatch[1].replace(/[–—]/g, '-'),
            }
        }

        return {
            success: false,
            date: null,
        }
    }
    catch (error: unknown) {
        console.error('Date scraping error:', error)
        throw createError({
            statusCode: 500,
            message: error instanceof Error ? error.message : 'Failed to scrape date from page',
        })
    }
})

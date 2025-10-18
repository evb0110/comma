interface INavigationResponse {
    resource?: {
        title?: string
        dublinCore?: {
            source?: string[]
            coverage?: string[]
            language?: string[]
        }
    }
}

interface IIIIFMetadata {
    metadata?: Array<{
        label: string
        value: string
    }>
}

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const resourceUrl = typeof query.resource === 'string' ? query.resource : undefined

    if (!resourceUrl) {
        throw createError({
            statusCode: 400,
            message: 'Resource URL is required',
        })
    }

    try {
        const encodedResource = encodeURIComponent(resourceUrl)

        const navData = await $fetch<INavigationResponse>(`https://comma.inria.fr/api/navigation/`, {
            params: {
                resource: resourceUrl,
                down: 1,
            },
        })
        const title = navData.resource?.title || ''
        const dublinCore = navData.resource?.dublinCore || {}
        const iiifManifestUrl = dublinCore.source?.[0]
        const coverage = dublinCore.coverage?.[0] || ''
        const language = dublinCore.language?.[0] || ''

        let datation = coverage

        if (iiifManifestUrl) {
            try {
                const iiifMetadata = await $fetch<IIIIFMetadata>(iiifManifestUrl)
                const metadata = iiifMetadata?.metadata || []
                const datationField = metadata.find(m =>
                    m.label === 'Datation' || m.label === 'Dating'
                )
                if (datationField?.value) {
                    datation = datationField.value
                }
            }
            catch (err) {
                console.error('Failed to fetch IIIF manifest:', err)
            }
        }

        const { extractRepositoryAndShelfMark } = await import('~/utils/comma')
        const {
            repository,
            shelfMark,
        } = extractRepositoryAndShelfMark(title)

        let displayDate = datation

        const startYear = coverage.match(/(\d{3,4})/)?.[1]
        if (startYear) {
            const start = parseInt(startYear)
            const endYear = start + 25
            displayDate = `${start}-${endYear}`
        }

        return {
            success: true,
            data: {
                title,
                repository,
                shelfMark,
                dating: displayDate,
                language,
                iiifManifestUrl,
                resourceUrl,
                encodedResource,
            },
        }
    }
    catch (error: unknown) {
        console.error('Metadata fetch error:', error)
        throw createError({
            statusCode: 500,
            message: error instanceof Error ? error.message : 'Failed to fetch metadata',
        })
    }
})

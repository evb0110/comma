export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const resourceUrl = query.resource as string

  if (!resourceUrl) {
    throw createError({
      statusCode: 400,
      message: 'Resource URL is required'
    })
  }

  try {
    const encodedResource = encodeURIComponent(resourceUrl)

    const navigationResponse = await $fetch(`https://comma.inria.fr/api/navigation/`, {
      params: {
        resource: resourceUrl,
        down: 1
      }
    })

    const navData = navigationResponse as any
    const title = navData.resource?.title || ''
    const dublinCore = navData.resource?.dublinCore || {}
    const iiifManifestUrl = dublinCore.source?.[0]
    const coverage = dublinCore.coverage?.[0] || ''
    const language = dublinCore.language?.[0] || ''

    let iiifMetadata: any = null
    let datation = coverage

    if (iiifManifestUrl) {
      try {
        iiifMetadata = await $fetch(iiifManifestUrl)
        const metadata = iiifMetadata.metadata || []
        const datationField = metadata.find((m: any) =>
          m.label === 'Datation' || m.label === 'Dating'
        )
        if (datationField?.value) {
          datation = datationField.value
        }
      } catch (err) {
        console.error('Failed to fetch IIIF manifest:', err)
      }
    }

    const { extractRepositoryAndShelfMark } = await import('~/utils/comma')
    const { repository, shelfMark } = extractRepositoryAndShelfMark(title)

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
        encodedResource
      }
    }
  } catch (error: any) {
    console.error('Metadata fetch error:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch metadata'
    })
  }
})

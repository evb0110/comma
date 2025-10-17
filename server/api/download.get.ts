export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const resourceUrl = query.resource as string
  const format = (query.format as string) || 'xml'
  const filename = (query.filename as string) || 'document.xml'

  if (!resourceUrl) {
    throw createError({
      statusCode: 400,
      message: 'Resource URL is required'
    })
  }

  try {
    const xmlData = await $fetch(`https://comma.inria.fr/api/document/`, {
      params: {
        resource: resourceUrl
      },
      responseType: 'text'
    })

    if (format === 'xml') {
      setResponseHeaders(event, {
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="${filename}"`
      })
      return xmlData
    }

    throw createError({
      statusCode: 400,
      message: 'Unsupported format. Currently only XML is supported.'
    })
  } catch (error: any) {
    console.error('Download error:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to download document'
    })
  }
})

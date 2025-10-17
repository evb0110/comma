import { parseTEIXML } from '../utils/tei-parser'
import { convertTEIToDocx } from '../utils/docx-converter'
import { convertTEIToPdf } from '../utils/pdf-converter'

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
    }) as string

    if (format === 'xml') {
      setResponseHeaders(event, {
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="${filename}"`
      })
      return xmlData
    }

    const metadataResponse = await $fetch('/api/metadata', {
      params: { resource: resourceUrl }
    }) as any

    const metadata = metadataResponse.data

    const teiContent = parseTEIXML(xmlData)

    if (format === 'docx') {
      const buffer = await convertTEIToDocx(teiContent, metadata)
      setResponseHeaders(event, {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`
      })
      return buffer
    }

    if (format === 'pdf') {
      const buffer = await convertTEIToPdf(teiContent, metadata)
      setResponseHeaders(event, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`
      })
      return buffer
    }

    throw createError({
      statusCode: 400,
      message: 'Unsupported format. Supported formats: xml, docx, pdf'
    })
  } catch (error: any) {
    console.error('Download error:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to download document'
    })
  }
})

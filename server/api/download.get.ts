import { convertTEIToDocx } from '~~/server/utils/docx-converter'
import { convertTEIToPdf } from '~~/server/utils/pdf-converter'
import { parseTEIXML } from '~~/server/utils/tei-parser'

interface IMetadataResponse {
    data: {
        title: string
        repository: string
        shelfMark: string
        dating: string
        language?: string
        iiifManifestUrl?: string
    }
}

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const resourceUrl = typeof query.resource === 'string' ? query.resource : undefined
    const format = typeof query.format === 'string' ? query.format : undefined
    const filename = typeof query.filename === 'string' ? query.filename : undefined

    if (!resourceUrl) {
        throw createError({
            statusCode: 400,
            message: 'Resource URL is required',
        })
    }

    try {
        const xmlData = await $fetch<string>(`https://comma.inria.fr/api/document/`, {
            params: { resource: resourceUrl },
            responseType: 'text',
        })

        if (format === 'xml') {
            const xmlBuffer = Buffer.from(xmlData, 'utf-8')
            const finalFilename = filename || 'document.xml'
            setResponseHeaders(event, {
                'Content-Type': 'application/xml; charset=utf-8',
                'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(finalFilename)}`,
                'Content-Length': xmlBuffer.length.toString(),
                'Cache-Control': 'no-cache',
            })
            return xmlBuffer
        }

        const metadataResponse = await $fetch<IMetadataResponse>('/api/metadata', { params: { resource: resourceUrl } })

        const metadata = metadataResponse.data

        const teiContent = parseTEIXML(xmlData)

        if (format === 'docx') {
            const buffer = await convertTEIToDocx(teiContent, metadata)
            const finalFilename = filename || 'document.docx'
            setResponseHeaders(event, {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(finalFilename)}`,
                'Content-Length': buffer.length.toString(),
                'Cache-Control': 'no-cache',
            })
            return buffer
        }

        if (format === 'pdf') {
            const buffer = await convertTEIToPdf(teiContent, metadata)
            const finalFilename = filename || 'document.pdf'
            setResponseHeaders(event, {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(finalFilename)}`,
                'Content-Length': buffer.length.toString(),
                'Cache-Control': 'no-cache',
            })
            return buffer
        }

        throw createError({
            statusCode: 400,
            message: 'Unsupported format. Supported formats: xml, docx, pdf',
        })
    }
    catch (error: unknown) {
        console.error('Download error:', error)
        throw createError({
            statusCode: 500,
            message: error instanceof Error ? error.message : 'Failed to download document',
        })
    }
})

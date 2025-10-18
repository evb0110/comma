import PDFDocument from 'pdfkit'
import type { IManuscriptMetadata } from '~~/app/utils/comma'
import type { ITEIContent } from '~~/server/utils/tei-parser'
import { FONT_REGULAR, FONT_ITALIC } from './embedded-fonts'

function loadFonts(doc: PDFKit.PDFDocument) {
    const fontRegularBuffer = Buffer.from(FONT_REGULAR, 'base64')
    const fontItalicBuffer = Buffer.from(FONT_ITALIC, 'base64')

    doc.registerFont('NotoSerif', fontRegularBuffer)
    doc.registerFont('NotoSerif-Italic', fontItalicBuffer)
}

export async function convertTEIToPdf(teiContent: ITEIContent, metadata: IManuscriptMetadata): Promise<Buffer> {
    const doc = new PDFDocument({
        size: 'A4',
        margins: {
            top: 72,
            bottom: 72,
            left: 72,
            right: 72,
        },
    })

    loadFonts(doc)

    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = []

        doc.on('data', chunk => chunks.push(chunk))
        doc.on('end', () => resolve(Buffer.concat(chunks)))
        doc.on('error', reject)

        doc.font('NotoSerif')
            .fontSize(24)
            .text(metadata.repository || '', { align: 'left' })

        doc.moveDown(0.5)
        doc.fontSize(18)
            .text(metadata.shelfMark || '', { align: 'left' })

        doc.moveDown(0.5)
        doc.fontSize(12)
        if (metadata.dating) {
            doc.text(`Dating: ${metadata.dating}`)
        }
        if (metadata.language) {
            doc.text(`Language: ${metadata.language}`)
        }

        doc.moveDown(2)

        teiContent.pages.forEach((page, pageIndex) => {
            if (pageIndex > 0) {
                doc.addPage()
            }

            doc.fontSize(14)
                .font('NotoSerif')
                .text(`[${page.pageNumber}]`, { continued: false })
                .moveDown(0.5)

            doc.fontSize(10)
                .font('NotoSerif')

            page.lines.forEach((line) => {
                if (line.text.trim()) {
                    if (line.type === 'note-marginal') {
                        doc.font('NotoSerif-Italic')
                            .text(`[Marginal note: ${line.text}]`, {
                                indent: 20,
                                lineGap: 2,
                                characterSpacing: 0,
                            })
                            .font('NotoSerif')
                    }
                    else if (line.type === 'note-interlinear') {
                        doc.font('NotoSerif-Italic')
                            .text(`[Interlinear: ${line.text}]`, {
                                indent: 20,
                                lineGap: 2,
                                characterSpacing: 0,
                            })
                            .font('NotoSerif')
                    }
                    else {
                        doc.text(line.text, {
                            lineGap: 2,
                            characterSpacing: 0,
                        })
                    }
                }
            })
        })

        doc.end()
    })
}

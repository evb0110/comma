import PDFDocument from 'pdfkit'
import type { TEIContent } from './tei-parser'

export async function convertTEIToPdf(teiContent: TEIContent, metadata: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 72,
        bottom: 72,
        left: 72,
        right: 72
      }
    })

    const chunks: Buffer[] = []

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.fontSize(24)
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
        .font('Helvetica-Bold')
        .text(`[${page.pageNumber}]`, { continued: false })
        .moveDown(0.5)

      doc.fontSize(10)
        .font('Helvetica')

      page.lines.forEach((line) => {
        if (line.text.trim()) {
          if (line.type === 'note-marginal') {
            doc.font('Helvetica-Oblique')
              .text(`[Marginal note: ${line.text}]`, { indent: 20 })
              .font('Helvetica')
          } else if (line.type === 'note-interlinear') {
            doc.font('Helvetica-Oblique')
              .text(`[Interlinear: ${line.text}]`, { indent: 20 })
              .font('Helvetica')
          } else {
            doc.text(line.text)
          }
        }
      })
    })

    doc.end()
  })
}

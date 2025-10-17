import { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak } from 'docx'
import type { TEIContent } from './tei-parser'

export async function convertTEIToDocx(teiContent: TEIContent, metadata: any): Promise<Buffer> {
  const children: (Paragraph | any)[] = []

  children.push(
    new Paragraph({
      text: metadata.repository || '',
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 }
    })
  )

  children.push(
    new Paragraph({
      text: metadata.shelfMark || '',
      heading: HeadingLevel.HEADING_2,
      spacing: { after: 100 }
    })
  )

  if (metadata.dating) {
    children.push(
      new Paragraph({
        text: `Dating: ${metadata.dating}`,
        spacing: { after: 100 }
      })
    )
  }

  if (metadata.language) {
    children.push(
      new Paragraph({
        text: `Language: ${metadata.language}`,
        spacing: { after: 400 }
      })
    )
  }

  teiContent.pages.forEach((page, pageIndex) => {
    if (pageIndex > 0) {
      children.push(new Paragraph({ children: [new PageBreak()] }))
    }

    children.push(
      new Paragraph({
        text: `[${page.pageNumber}]`,
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 200 }
      })
    )

    page.lines.forEach((line) => {
      if (line.text.trim()) {
        const runs: TextRun[] = []

        if (line.type === 'note-marginal') {
          runs.push(
            new TextRun({
              text: '[Marginal note: ',
              italics: true
            }),
            new TextRun({
              text: line.text,
              italics: true
            }),
            new TextRun({
              text: ']',
              italics: true
            })
          )
        } else if (line.type === 'note-interlinear') {
          runs.push(
            new TextRun({
              text: '[Interlinear: ',
              italics: true
            }),
            new TextRun({
              text: line.text,
              italics: true
            }),
            new TextRun({
              text: ']',
              italics: true
            })
          )
        } else {
          runs.push(new TextRun({ text: line.text }))
        }

        children.push(
          new Paragraph({
            children: runs,
            spacing: { after: 50 }
          })
        )
      }
    })
  })

  const doc = new Document({
    sections: [{
      properties: {},
      children
    }]
  })

  return await Packer.toBuffer(doc)
}

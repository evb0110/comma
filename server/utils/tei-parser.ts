import { XMLParser } from 'fast-xml-parser'

export interface TEIContent {
  title: string
  pages: TEIPage[]
}

export interface TEIPage {
  pageNumber: string
  lines: TEILine[]
}

export interface TEILine {
  text: string
  type: 'text' | 'note-marginal' | 'note-interlinear'
}

export function parseTEIXML(xmlString: string): TEIContent {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    preserveOrder: true,
    trimValues: true
  })

  const parsed = parser.parse(xmlString)

  let title = 'Untitled'
  const pages: TEIPage[] = []
  let currentPage: TEIPage | null = null
  let currentLineText = ''

  const extractText = (node: any): string => {
    if (!node) return ''
    if (typeof node === 'string') return node

    let text = ''
    if (Array.isArray(node)) {
      for (const item of node) {
        text += extractText(item)
      }
    } else if (typeof node === 'object') {
      for (const key in node) {
        if (key === '#text') {
          text += node[key]
        } else if (key !== ':@') {
          text += extractText(node[key])
        }
      }
    }
    return text
  }

  const processNodes = (nodes: any[]): void => {
    if (!Array.isArray(nodes)) return

    for (const node of nodes) {
      if (!node) continue

      if (node.title) {
        const titleText = extractText(node.title)
        if (titleText) title = titleText
      }

      if (node.pb) {
        if (currentPage && currentLineText.trim()) {
          if (currentPage.lines.length > 0) {
            currentPage.lines[currentPage.lines.length - 1].text = currentLineText.trim()
          }
          currentLineText = ''
        }

        if (currentPage) {
          pages.push(currentPage)
        }

        const attrs = node[':@']
        currentPage = {
          pageNumber: attrs?.['@_n'] || 'unknown',
          lines: []
        }
      }

      if (node.lb) {
        if (currentPage) {
          if (currentLineText.trim()) {
            currentPage.lines.push({
              text: currentLineText.trim(),
              type: 'text'
            })
          }
          currentLineText = ''
        }
      }

      if (node['#text']) {
        const text = typeof node['#text'] === 'string' ? node['#text'].trim() : String(node['#text']).trim()
        if (text) {
          currentLineText += (currentLineText ? ' ' : '') + text
        }
      }

      if (node.note) {
        if (currentPage && currentLineText.trim()) {
          currentPage.lines.push({
            text: currentLineText.trim(),
            type: 'text'
          })
          currentLineText = ''
        }

        const attrs = node[':@']
        const noteType = attrs?.['@_type']
        const noteText = extractText(node.note).trim()

        if (noteText && currentPage) {
          currentPage.lines.push({
            text: noteText,
            type: noteType === 'marginal' ? 'note-marginal' : 'note-interlinear'
          })
        }
      }

      for (const key in node) {
        if (key !== ':@' && key !== '#text' && Array.isArray(node[key])) {
          processNodes(node[key])
        }
      }
    }
  }

  processNodes(parsed)

  if (currentPage) {
    if (currentLineText.trim()) {
      currentPage.lines.push({
        text: currentLineText.trim(),
        type: 'text'
      })
    }
    pages.push(currentPage)
  }

  return { title, pages }
}

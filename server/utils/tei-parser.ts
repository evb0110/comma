import { XMLParser } from 'fast-xml-parser'

type TXMLNode = {
    [key: string]: unknown
    '#text'?: string
    ':@'?: {
        [key: string]: string
    }
}

export interface ITEIContent {
    title: string
    pages: ITEIPage[]
}

export interface ITEIPage {
    pageNumber: string
    lines: ITEILine[]
}

export interface ITEILine {
    text: string
    type: 'text' | 'note-marginal' | 'note-interlinear'
}

export function parseTEIXML(xmlString: string): ITEIContent {
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        textNodeName: '#text',
        preserveOrder: true,
        trimValues: true,
    })

    const parsed = parser.parse(xmlString)

    let title = 'Untitled'
    const pages: ITEIPage[] = []
    let currentPage: ITEIPage | null = null
    let currentLineText = ''

    const extractText = (node: unknown): string => {
        if (!node) return ''
        if (typeof node === 'string') return node

        let text = ''
        if (Array.isArray(node)) {
            for (const item of node) {
                text += extractText(item)
            }
        }
        else if (typeof node === 'object') {
            const obj = node as Record<string, unknown>
            for (const key in obj) {
                if (key === '#text') {
                    text += obj[key]
                }
                else if (key !== ':@') {
                    text += extractText(obj[key])
                }
            }
        }
        return text
    }

    const processNodes = (nodes: TXMLNode[]) => {
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
                        const lastLine = currentPage.lines[currentPage.lines.length - 1]
                        if (lastLine) {
                            lastLine.text = currentLineText.trim()
                        }
                    }
                    currentLineText = ''
                }

                if (currentPage) {
                    pages.push(currentPage)
                }

                const attrs = node[':@']
                currentPage = {
                    pageNumber: attrs?.['@_n'] || 'unknown',
                    lines: [],
                }
            }

            if (node.lb) {
                if (currentPage) {
                    if (currentLineText.trim()) {
                        currentPage.lines.push({
                            text: currentLineText.trim(),
                            type: 'text',
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
                        type: 'text',
                    })
                    currentLineText = ''
                }

                const attrs = node[':@']
                const noteType = attrs?.['@_type']
                const noteText = extractText(node.note).trim()

                if (noteText && currentPage) {
                    currentPage.lines.push({
                        text: noteText,
                        type: noteType === 'marginal' ? 'note-marginal' : 'note-interlinear',
                    })
                }
            }

            for (const key in node) {
                if (key !== ':@' && key !== '#text' && Array.isArray(node[key])) {
                    processNodes(node[key] as TXMLNode[])
                }
            }
        }
    }

    processNodes(parsed as TXMLNode[])

    if (currentPage) {
        const finalPage: ITEIPage = currentPage
        if (currentLineText.trim()) {
            finalPage.lines.push({
                text: currentLineText.trim(),
                type: 'text',
            })
        }
        pages.push(finalPage)
    }

    return {
        title,
        pages,
    }
}

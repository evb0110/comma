export interface IParsedCoMMAUrl {
    resourceUrl: string
    encodedResource: string
    pageRef?: string
}

export interface IManuscriptMetadata {
    title: string
    repository: string
    shelfMark: string
    dating: string
    language?: string
    iiifManifestUrl?: string
}

export function parseCoMMAUrl(url: string): IParsedCoMMAUrl | null {
    try {
        const urlObj = new URL(url)

        if (!urlObj.hostname.includes('comma.inria.fr')) {
            return null
        }

        const pathMatch = urlObj.pathname.match(/\/doc\/([^/]+)(?:\/p\/([^/]+))?/)
        if (!pathMatch || !pathMatch[1]) {
            return null
        }

        const encodedResource = pathMatch[1]
        let resourceUrl = decodeURIComponent(encodedResource)

        if (resourceUrl.includes('%')) {
            resourceUrl = decodeURIComponent(resourceUrl)
        }

        const pageRef = pathMatch[2]

        return {
            resourceUrl,
            encodedResource,
            pageRef,
        }
    }
    catch {
        return null
    }
}

export function extractRepositoryAndShelfMark(title: string): { repository: string
    shelfMark: string } {
    const cleanTitle = title.replace(/\.$/, '').trim()

    const parts = cleanTitle.split(',').map(p => p.trim())
    if (parts.length >= 2) {
        const lastPart = parts[parts.length - 1] || ''
        const repositoryParts = parts.slice(0, -1).join(', ')
            .replace(/Bibliothèque\s+/gi, '')
            .replace(/\.\s+/g, ' ')
            .trim()

        return {
            repository: repositoryParts,
            shelfMark: lastPart,
        }
    }

    const lastCommaIndex = cleanTitle.lastIndexOf(',')
    if (lastCommaIndex > 0) {
        const repository = cleanTitle.substring(0, lastCommaIndex)
            .replace(/Bibliothèque\s+/gi, '')
            .replace(/\.\s+/g, ' ')
            .trim()
        const shelfMark = cleanTitle.substring(lastCommaIndex + 1).trim()
        return {
            repository,
            shelfMark,
        }
    }

    const msMatch = cleanTitle.match(/^(.+?)[.,]\s*(Ms\.?\s*\d+.*)$/i)
    if (msMatch && msMatch[1] && msMatch[2]) {
        const repository = msMatch[1]
            .replace(/Bibliothèque\s+/gi, '')
            .replace(/\.\s+/g, ' ')
            .trim()
        const shelfMark = msMatch[2].trim()
        return {
            repository,
            shelfMark,
        }
    }

    return {
        repository: cleanTitle.replace(/Bibliothèque\s+/gi, '').replace(/\.\s+/g, ' ').trim(),
        shelfMark: '',
    }
}

export function generateFilename(metadata: IManuscriptMetadata, extension: string): string {
    const parts: string[] = []

    if (metadata.repository) {
        parts.push(metadata.repository)
    }

    if (metadata.shelfMark) {
        parts.push(metadata.shelfMark)
    }

    if (metadata.dating) {
        parts.push(metadata.dating)
    }

    const filename = parts.join(' ').trim()

    return `${filename}.${extension}`
}

export function extractDatingFromIIIF(metadata: Array<{
    label: string
    value: string
}>): string {
    const datationField = metadata?.find(m => m.label === 'Datation' || m.label === 'Dating')
    if (datationField?.value) {
        return datationField.value
    }
    return ''
}

export function parseCenturyToYears(centuryText: string): string {
    const match = centuryText.match(/(\d+)e?\s*s\.?\s*\(([^)]+)\)/i)
    if (match && match[1] && match[2]) {
        const century = parseInt(match[1])
        const qualifier = match[2].toLowerCase()

        if (qualifier.includes('premier') || qualifier.includes('début') || qualifier.includes('early')) {
            const startYear = (century - 1) * 100
            return `${startYear}-${startYear + 25}`
        }
        if (qualifier.includes('dernier') || qualifier.includes('fin') || qualifier.includes('late')) {
            const startYear = (century - 1) * 100 + 75
            const endYear = century * 100
            return `${startYear}-${endYear}`
        }
    }

    const simpleCentury = centuryText.match(/(\d+)e?\s*s\.?/i)
    if (simpleCentury && simpleCentury[1]) {
        const century = parseInt(simpleCentury[1])
        const startYear = (century - 1) * 100
        const endYear = century * 100
        return `${startYear}-${endYear}`
    }

    return centuryText
}

# Comma - TEI XML Converter

## Project Overview
Comma is a web application for converting large TEI (Text Encoding Initiative) XML files to DOCX and PDF formats. The application works with CoMMA viewer URLs to fetch manuscripts from various digital libraries.

## File Structure
- **Source Files**: Example XML files are stored in `/source/` directory
- **TEI Format**: Files use TEI XML standard for encoding manuscript transcriptions
- **File Size**: Source files are very large (2-3 MB+, 50k+ lines)

## CoMMA API Integration

### Input Format
Users provide a CoMMA viewer URL:
```
https://comma.inria.fr/doc/https%253A%252F%252Fdata.biblissima.fr%252Fentity%252FQ215980/p/f0-plat-superieur
```

### URL Parsing
Extract the encoded resource URL from the CoMMA URL:
- Pattern: `/doc/{ENCODED_RESOURCE_URL}/p/{PAGE_REF}`
- Example resource: `https%253A%252F%252Fdata.biblissima.fr%252Fentity%252FQ215980`
- Decoded: `https://data.biblissima.fr/entity/Q215980`

### API Endpoints

#### 1. Navigation API
**URL:** `https://comma.inria.fr/api/navigation/?resource={ENCODED_RESOURCE}&down=1`

**Returns:**
```json
{
  "resource": {
    "title": "Paris. Bibliothèque Mazarine, Ms 4",
    "dublinCore": {
      "language": ["lat"],
      "coverage": ["1075–"],
      "source": ["https://api.irht.cnrs.fr/ark:/63955/fn0jny3tc5kz/manifest.json"]
    }
  }
}
```

**Provides:**
- Document title (includes repository and shelf mark)
- IIIF manifest URL
- Partial dating information

#### 2. IIIF Manifest API
**URL:** From Navigation API `dublinCore.source[0]`

**Returns:**
```json
{
  "label": "France, Paris, fonds principal, 0004 (intégral)",
  "metadata": [
    {"label": "Cote", "value": "France, Paris, fonds principal, 0004"},
    {"label": "Datation", "value": "12e s. (premier quart ?) ; 13e-14e s."},
    {"label": "Auteur, titre, oeuvre", "value": "Bible"}
  ]
}
```

**Provides:**
- Detailed dating information
- Shelf mark (Cote)
- Additional bibliographic metadata

#### 3. Document Download API
**URL:** `https://comma.inria.fr/api/document/?resource={ENCODED_RESOURCE}`

**Returns:** Complete TEI XML file (2-3 MB)

**Note:** Same endpoint with `&mediaType=html&ref={PAGE}` returns HTML fragments for individual pages

## Metadata Extraction

### Filename Format
Generated filenames must include all relevant metadata:
`[Repository] [ShelfMark] [Date Range].[extension]`

**Example:** `Paris Mazarine Ms 4 1075-1100.pdf`

### Metadata Components

#### Repository
**Source:** Navigation API `resource.title`
- Full title: "Paris. Bibliothèque Mazarine, Ms 4"
- Extract: "Paris Mazarine" (remove "Bibliothèque" for brevity)

#### Shelf Mark
**Source:** Navigation API `resource.title` or IIIF `metadata.Cote`
- From title: "Ms 4"
- From IIIF: "France, Paris, fonds principal, 0004" → "Ms 4"

#### Dating
**Primary Source:** Page display shows "1075–1100"
**Fallback Sources:**
- IIIF `metadata.Datation`: "12e s. (premier quart ?) ; 13e-14e s."
- Navigation API `dublinCore.coverage`: "1075–"

**Note:** The exact date range displayed on the page may be a frontend calculation. Consider implementing century-to-year conversion logic or fetching from page DOM.

## Technical Stack
- **Framework**: Nuxt 4
- **Package Manager**: pnpm (NOT npm - always use `pnpm install`, `pnpm add`, etc.)
- **UI Library**: Nuxt UI (available)
- **File Processing**: Server-side API routes for large file handling
- **Output Formats**: DOCX and PDF generation
- **Dependencies**:
  - fast-xml-parser (XML parsing)
  - docx (DOCX generation)
  - pdfkit (PDF generation)

## User Flow
1. Landing page with URL input field
2. User pastes CoMMA viewer URL
3. System fetches metadata from Navigation + IIIF APIs
4. Display extracted metadata and generated filename
5. User selects output format (DOCX or PDF)
6. System downloads XML from CoMMA API
7. File is converted and downloaded with proper filename

## Implementation Notes
- Use server-side API routes to avoid CORS issues
- Handle large XML files with streaming where possible
- Cache metadata responses to improve performance
- Validate CoMMA URL format before making API calls
- Provide fallback metadata values for incomplete data
- Handle various library formats (not just Biblissima)

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

## Font Support

### PDF Unicode Support
PDF generation uses **Noto Serif** font (included in `/server/assets/fonts/`) which provides excellent support for medieval Latin characters including:
- Combining diacritics (ũ, ẽ, ñ, ē, etc.)
- Special Latin characters (ł, etc.)
- Most medieval abbreviation marks

**Font files included:**
- `NotoSerif-Regular.ttf` (363KB)
- `NotoSerif-Italic.ttf` (390KB)

**Note:** Some very rare medieval characters may still not render. For 100% accuracy:
- Use **XML format** - Preserves all characters exactly
- Use **DOCX format** - Relies on system fonts in Word/LibreOffice

## TypeScript and Type Safety

### Type Casting Guidelines
**CRITICAL: Minimize use of the `as` operator. Prefer proper type annotations and type inference.**

#### Pattern 1: Function Parameters (Preferred over `as`)
✅ **Good - Use type annotation:**
```typescript
function processPage(page: ITEIPage) { }
```

❌ **Bad - Use casting:**
```typescript
function processPage(page: unknown as ITEIPage) { }
```

#### Pattern 2: $fetch API Calls (Use generic type parameter)
✅ **Good - Use generic type parameter:**
```typescript
const data = await $fetch<IMetadataResponse>('/api/metadata', { params })
```

❌ **Bad - Use casting:**
```typescript
const data = await $fetch('/api/metadata', { params }) as IMetadataResponse
```

#### Pattern 3: Query Parameters (Use type narrowing)
✅ **Good - Type narrowing:**
```typescript
const resourceUrl = typeof query.resource === 'string' ? query.resource : undefined
```

❌ **Bad - Use casting:**
```typescript
const resourceUrl = query.resource as string
```

#### Pattern 4: Destructuring with Type Guards (Avoid `as` in catch blocks)
✅ **Good - Standard catch pattern (required in TS 4.0+):**
```typescript
catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
}
```

❌ **Bad - Type assertion on unknown:**
```typescript
catch (error: unknown) {
    const message = (error as Error).message  // Can throw!
}
```

### Callback Type Inference
**CRITICAL: Let TypeScript infer callback parameter types from array types upstream.**

✅ **Good - Inferred from array type:**
```typescript
// ITEIContent.pages is typed as ITEIPage[]
teiContent.pages.forEach((page) => {
    page.lines.forEach((line) => {
        // Types inferred: page is ITEIPage, line is ITEILine
    })
})
```

❌ **Bad - Explicit callback typing:**
```typescript
teiContent.pages.forEach((page: ITEIPage, index: number) => {
    page.lines.forEach((line: ITEILine) => {
        // Redundant explicit types
    })
})
```

### Explicit Return Types
**CRITICAL: Remove unnecessary explicit return type annotations where TypeScript can infer them.**

✅ **Good - Inferred return type:**
```typescript
const processNodes = (nodes: TXMLNode[]) => {
    // Return type inferred from function body
}
```

❌ **Bad - Unnecessary explicit return type:**
```typescript
const processNodes = (nodes: TXMLNode[]): void => {
    // Explicit void is redundant for simple functions
}
```

### Interface Naming Convention
All interfaces must follow the `I` prefix pattern per ESLint rules:
```typescript
interface IMetadataResponse { }      // ✓ Good
interface INavigationResponse { }    // ✓ Good
interface MetadataResponse { }       // ✗ Bad - Missing I prefix
```

### Verification
After making type-related changes, **ALWAYS** run both:
```bash
pnpm run lint      # Check ESLint rules
pnpm run typecheck # Verify TypeScript types
```

Both must pass with no errors before considering work complete.

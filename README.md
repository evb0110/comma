# Comma - TEI XML to DOCX/PDF Converter

[![Made with Nuxt UI](https://img.shields.io/badge/Made%20with-Nuxt%20UI-00DC82?logo=nuxt&labelColor=020420)](https://ui.nuxt.com)

A web application for converting large TEI (Text Encoding Initiative) XML files to DOCX and PDF formats. Integrates with CoMMA viewer URLs to fetch manuscripts from various digital libraries including Biblissima and other collections.

## Features

- **TEI XML Support**: Parse and convert complex TEI-encoded manuscripts
- **Multiple Output Formats**: Export to DOCX or PDF with full formatting preservation
- **Large File Handling**: Process XML files up to 2-3 MB with 50k+ lines
- **Rich Metadata**: Extract and include repository info, shelf marks, and dating information
- **Medieval Character Support**: Full Unicode support including rare diacritics and abbreviation marks
- **CoMMA Integration**: Direct support for CoMMA viewer URLs from various digital libraries
- **Automatic Metadata**: Extract title, repository, shelf mark, and dating from CoMMA API

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 10.18.2+

### Installation

```bash
pnpm install
```

### Development

Start the development server on `http://localhost:3000`:

```bash
pnpm dev
```

### Production Build

Build the application for production:

```bash
pnpm build
```

Preview the production build locally:

```bash
pnpm preview
```

### Quality Checks

Check TypeScript types:

```bash
pnpm typecheck
```

Lint and fix code style:

```bash
pnpm lint
```

## Project Structure

```
.
├── app/                              # Client-side code
│   ├── pages/                        # Nuxt pages
│   │   └── index.vue                # Landing page with URL input
│   ├── components/                   # Vue components
│   ├── utils/                        # Client utilities
│   ├── assets/css/                   # Stylesheets
│   └── app.vue                       # Root component
├── server/                           # Server-side API routes
│   ├── api/                          # API endpoints
│   │   ├── metadata.get.ts           # Fetch CoMMA metadata
│   │   ├── scrape-date.get.ts        # Extract date information
│   │   └── download.get.ts           # Download and convert files
│   ├── utils/                        # Server utilities
│   │   ├── tei-parser.ts             # TEI XML parsing
│   │   ├── docx-converter.ts         # DOCX generation
│   │   ├── pdf-converter.ts          # PDF generation
│   │   └── embedded-fonts.ts         # Font management
│   └── fonts/                        # Font files
│       ├── NotoSerif-Regular.ttf     # Regular font (363KB)
│       └── NotoSerif-Italic.ttf      # Italic font (390KB)
├── public/                           # Static assets
├── source/                           # Example XML files
├── nuxt.config.ts                    # Nuxt configuration
├── tsconfig.json                     # TypeScript configuration
└── package.json                      # Dependencies
```

## User Flow

1. User visits the landing page
2. Pastes a CoMMA viewer URL (e.g., `https://comma.inria.fr/doc/...`)
3. System automatically extracts and displays:
   - Document title
   - Repository and shelf mark
   - Dating information
   - Generated filename
4. User selects output format (DOCX or PDF)
5. System downloads TEI XML from CoMMA API
6. File is converted to selected format
7. Download begins with properly formatted filename

## CoMMA API Integration

### Input Format

Users provide a CoMMA viewer URL:

```
https://comma.inria.fr/doc/https%253A%252F%252Fdata.biblissima.fr%252Fentity%252FQ215980/p/f0-plat-superieur
```

### URL Parsing

The application extracts the encoded resource URL from the CoMMA URL:
- **Pattern**: `/doc/{ENCODED_RESOURCE_URL}/p/{PAGE_REF}`
- **Example resource**: `https%253A%252F%252Fdata.biblissima.fr%252Fentity%252FQ215980`
- **Decoded**: `https://data.biblissima.fr/entity/Q215980`

### API Endpoints

#### 1. Navigation API

Returns basic document information and IIIF manifest URL.

```
GET https://comma.inria.fr/api/navigation/?resource={ENCODED_RESOURCE}&down=1
```

**Response includes:**
- Document title
- Language information
- IIIF manifest URL
- Partial dating information

#### 2. IIIF Manifest API

Returns detailed bibliographic metadata including dating and shelf mark.

**Response includes:**
- Document label
- Detailed dating (e.g., "12e s. (premier quart ?) ; 13e-14e s.")
- Shelf mark/Cote
- Other metadata fields

#### 3. Document Download API

Returns complete TEI XML file (2-3 MB).

```
GET https://comma.inria.fr/api/document/?resource={ENCODED_RESOURCE}
```

**Note**: Use `&mediaType=html&ref={PAGE}` to fetch HTML fragments for individual pages.

## Metadata Extraction

### Filename Format

Generated filenames include all relevant metadata:

```
[Repository] [ShelfMark] [DateRange].[extension]
```

**Example:** `Paris Mazarine Ms 4 1075-1100.pdf`

### Metadata Components

- **Repository**: Extracted from document title (e.g., "Paris Mazarine")
- **Shelf Mark**: From title or IIIF metadata (e.g., "Ms 4")
- **Dating**: From page display, IIIF metadata, or Navigation API coverage

## Font Support

### PDF Unicode Support

PDF generation uses **Noto Serif** font family, providing excellent support for:
- Combining diacritics (ũ, ẽ, ñ, ē, etc.)
- Special Latin characters (ł, etc.)
- Medieval abbreviation marks
- Most Unicode medieval characters

**Included fonts:**
- `NotoSerif-Regular.ttf` (363KB)
- `NotoSerif-Italic.ttf` (390KB)

### Format Considerations

For maximum character accuracy:
- **XML format** - Preserves all characters exactly
- **DOCX format** - Relies on system fonts in Word/LibreOffice
- **PDF format** - Uses embedded Noto Serif font

## Technical Stack

- **Framework**: [Nuxt 4](https://nuxt.com)
- **UI Library**: [Nuxt UI](https://ui.nuxt.com)
- **Package Manager**: [pnpm](https://pnpm.io)
- **Language**: TypeScript
- **XML Parsing**: [fast-xml-parser](https://www.npmjs.com/package/fast-xml-parser)
- **DOCX Generation**: [docx](https://www.npmjs.com/package/docx)
- **PDF Generation**: [pdfkit](https://www.npmjs.com/package/pdfkit)

## Type Safety

This project uses TypeScript with strict type checking enabled. Key guidelines:

- Minimize use of the `as` operator
- Prefer type annotations and type inference
- Use generic type parameters for API calls
- Apply type narrowing for query parameters
- Always run `pnpm typecheck` after type-related changes

## Development Guidelines

### Code Style

- 4-space indentation
- Single quotes
- No semicolons
- Trailing commas never

See `eslint.config.mjs` for complete ESLint configuration.

### Before Committing

Always run quality checks:

```bash
pnpm typecheck
pnpm lint
```

Both must pass with no errors.

## Deployment

The application is configured for deployment on Vercel. See `.vercel/` configuration for details.

Build output is optimized for static hosting with server-side API routes for file processing.

## License

[Add your license information here]

## Contributing

Contributions are welcome. Please ensure all type checks and linting pass before submitting pull requests.

## Troubleshooting

### Large File Processing

The application is optimized for files up to 2-3 MB. For larger files:
- Consider using server-side streaming
- Check available memory on the server
- Monitor API response times

### Character Encoding Issues

If certain medieval characters don't render:
1. Try XML format first (most accurate)
2. Check system fonts in DOCX viewers
3. Report the character for investigation

### CoMMA URL Issues

Ensure the URL format is correct:
- Must start with `https://comma.inria.fr/doc/`
- Resource URL must be properly encoded
- Check that the digital library is accessible

## Resources

- [CoMMA Documentation](https://comma.inria.fr)
- [TEI Guidelines](https://tei-c.org)
- [IIIF Specifications](https://iiif.io)
- [Nuxt Documentation](https://nuxt.com)
- [Nuxt UI Documentation](https://ui.nuxt.com)

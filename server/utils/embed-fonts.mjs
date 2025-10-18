import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fontsDir = join(__dirname, '..', 'fonts')

const regular = readFileSync(join(fontsDir, 'NotoSerif-Regular.ttf'))
const italic = readFileSync(join(fontsDir, 'NotoSerif-Italic.ttf'))

const code = `// Auto-generated file - do not edit
export const FONT_REGULAR = '${regular.toString('base64')}'
export const FONT_ITALIC = '${italic.toString('base64')}'
`

writeFileSync(join(__dirname, 'embedded-fonts.ts'), code)
console.log('Fonts embedded successfully')

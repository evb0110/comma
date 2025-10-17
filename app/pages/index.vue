<script setup lang="ts">
import type { ManuscriptMetadata } from '~/utils/comma'

const commaUrl = ref('')
const loading = ref(false)
const error = ref('')
const metadata = ref<ManuscriptMetadata | null>(null)

const parsedUrl = computed(() => {
  if (!commaUrl.value) return null
  return parseCoMMAUrl(commaUrl.value)
})

const isValidUrl = computed(() => !!parsedUrl.value)

const generatedFilename = computed(() => {
  if (!metadata.value) return ''
  return generateFilename(metadata.value, 'xml')
})

async function fetchMetadata() {
  if (!parsedUrl.value) {
    error.value = 'Please enter a valid CoMMA URL'
    return
  }

  loading.value = true
  error.value = ''
  metadata.value = null

  try {
    const response = await $fetch('/api/metadata', {
      params: {
        resource: parsedUrl.value.resourceUrl
      }
    })

    if (response.success) {
      metadata.value = response.data
    }
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to fetch metadata'
    console.error('Fetch error:', err)
  } finally {
    loading.value = false
  }
}

function downloadFile(format: string) {
  if (!parsedUrl.value || !metadata.value) return

  const filename = generateFilename(metadata.value, format)
  const downloadUrl = `/api/download?resource=${encodeURIComponent(parsedUrl.value.resourceUrl)}&format=${format}&filename=${encodeURIComponent(filename)}`

  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const exampleUrl = 'https://comma.inria.fr/doc/https%253A%252F%252Fdata.biblissima.fr%252Fentity%252FQ215980/p/f0-plat-superieur'

function useExample() {
  commaUrl.value = exampleUrl
  fetchMetadata()
}
</script>

<template>
  <div>
    <UPageHero
      title="CoMMA TEI XML Converter"
      description="Convert manuscript transcriptions from CoMMA viewer to DOCX and PDF formats with automatic metadata extraction."
    />

    <UPageSection class="max-w-4xl mx-auto">
      <div class="space-y-6">
        <div>
          <label class="block text-sm font-medium mb-2">CoMMA Viewer URL</label>
          <UInput
            v-model="commaUrl"
            placeholder="https://comma.inria.fr/doc/..."
            size="xl"
            :disabled="loading"
            @keyup.enter="fetchMetadata"
          />
          <div class="mt-2 flex items-center gap-2 text-sm text-gray-500">
            <button
              type="button"
              class="underline hover:text-gray-700"
              @click="useExample"
            >
              Try example
            </button>
          </div>
        </div>

        <div class="flex gap-2">
          <UButton
            :disabled="!isValidUrl || loading"
            :loading="loading"
            size="lg"
            @click="fetchMetadata"
          >
            Fetch Metadata
          </UButton>
        </div>

        <UAlert
          v-if="error"
          color="red"
          variant="soft"
          :title="error"
          :close-button="{ icon: 'i-lucide-x', color: 'red', variant: 'link' }"
          @close="error = ''"
        />

        <div v-if="metadata" class="space-y-6">
          <hr class="border-gray-200 dark:border-gray-800">

          <div class="space-y-4">
            <h3 class="text-lg font-semibold">Extracted Metadata</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-500 mb-1">Repository</label>
                <p class="text-base">{{ metadata.repository || 'N/A' }}</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-500 mb-1">Shelf Mark</label>
                <p class="text-base">{{ metadata.shelfMark || 'N/A' }}</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-500 mb-1">Dating</label>
                <p class="text-base">{{ metadata.dating || 'N/A' }}</p>
              </div>

              <div v-if="metadata.language">
                <label class="block text-sm font-medium text-gray-500 mb-1">Language</label>
                <p class="text-base">{{ metadata.language }}</p>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-500 mb-1">Full Title</label>
              <p class="text-base">{{ metadata.title }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-500 mb-1">Generated Filename</label>
              <code class="block px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                {{ generatedFilename }}
              </code>
            </div>
          </div>

          <hr class="border-gray-200 dark:border-gray-800">

          <div class="space-y-4">
            <h3 class="text-lg font-semibold">Download</h3>

            <div class="flex flex-wrap gap-3">
              <UButton
                size="lg"
                icon="i-lucide-download"
                @click="downloadFile('xml')"
              >
                Download XML
              </UButton>

              <UButton
                size="lg"
                color="gray"
                variant="soft"
                icon="i-lucide-file-text"
                disabled
              >
                Download DOCX
                <span class="text-xs ml-1">(Coming soon)</span>
              </UButton>

              <UButton
                size="lg"
                color="gray"
                variant="soft"
                icon="i-lucide-file"
                disabled
              >
                Download PDF
                <span class="text-xs ml-1">(Coming soon)</span>
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </UPageSection>

    <UPageSection class="max-w-4xl mx-auto">
      <UPageCTA
        title="How it works"
        description="Paste a CoMMA viewer URL, we'll extract the metadata and generate properly named files."
        variant="subtle"
      />
    </UPageSection>
  </div>
</template>

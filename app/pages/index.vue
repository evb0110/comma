<script lang="ts" setup>
import type { IManuscriptMetadata } from '~/utils/comma'

const commaUrl = ref('')
const loading = ref(false)
const error = ref('')
const metadata = ref<IManuscriptMetadata | null>(null)

const downloadingXml = ref(false)
const downloadingDocx = ref(false)
const downloadingPdf = ref(false)

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
        const response = await $fetch('/api/metadata', { params: { resource: parsedUrl.value.resourceUrl } })

        if (response.success) {
            metadata.value = response.data
        }
    }
    catch (err: unknown) {
        error.value = (err as { data?: { message?: string } }).data?.message || 'Failed to fetch metadata'
        console.error('Fetch error:', err)
    }
    finally {
        loading.value = false
    }
}

async function downloadFile(format: string) {
    if (!parsedUrl.value || !metadata.value) return

    const loadingRef = format === 'xml' ? downloadingXml : format === 'docx' ? downloadingDocx : downloadingPdf

    try {
        loadingRef.value = true
        error.value = ''

        const filename = generateFilename(metadata.value, format)
        const downloadUrl = `/api/download?resource=${encodeURIComponent(parsedUrl.value.resourceUrl)}&format=${format}&filename=${encodeURIComponent(filename)}`

        const response = await fetch(downloadUrl, { headers: { Accept: format === 'xml' ? 'application/xml' : format === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf' } })

        if (!response.ok) {
            const errorText = await response.text().catch(() => '')
            throw new Error(`Download failed (${response.status}): ${response.statusText || errorText || 'Unknown error'}`)
        }

        const contentType = response.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Server error occurred')
        }

        const blob = await response.blob()

        if (blob.size === 0) {
            throw new Error('Downloaded file is empty')
        }

        const url = window.URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = url
        link.download = filename
        link.style.display = 'none'
        document.body.appendChild(link)

        setTimeout(() => {
            link.click()
            setTimeout(() => {
                document.body.removeChild(link)
                window.URL.revokeObjectURL(url)
            }, 100)
        }, 0)
    }
    catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : `Failed to download ${format.toUpperCase()}`
        error.value = errorMessage
        console.error('Download error:', err, {
            format,
            url: parsedUrl.value?.resourceUrl,
            userAgent: navigator.userAgent,
        })
    }
    finally {
        loadingRef.value = false
    }
}

const exampleUrl = 'https://comma.inria.fr/doc/https%253A%252F%252Fdata.biblissima.fr%252Fentity%252FQ215980/p/f0-plat-superieur'

function useExample() {
    commaUrl.value = exampleUrl
    fetchMetadata()
}
</script>

<template>
    <div>
        <UPageSection class="max-w-5xl mx-auto">
            <div>
                <label class="block text-sm font-medium mb-2">CoMMA Viewer URL</label>
                <div class="flex gap-3">
                    <UInput
                        v-model="commaUrl"
                        :disabled="loading"
                        class="w-full"
                        placeholder="https://comma.inria.fr/doc/..."
                        size="xl"
                        @keyup.enter="fetchMetadata"
                    />
                    <UButton
                        :disabled="!isValidUrl || loading"
                        :loading="loading"
                        icon="i-lucide-search"
                        size="lg"
                        variant="outline"
                        class="whitespace-nowrap"
                        @click="fetchMetadata"
                    >
                        Fetch Metadata
                    </UButton>
                </div>

                <UButton
                    v-if="false"
                    size="lg"
                    variant="outline"
                    @click="useExample"
                >
                    Try example
                </UButton>
            </div>

            <UAlert
                v-if="error"
                :close-button="{ icon: 'i-lucide-x', color: 'red', variant: 'link' }"
                :title="error"
                color="error"
                variant="soft"
                @close="error = ''"
            />

            <div v-if="metadata" class="space-y-6">
                <hr class="border-gray-200 dark:border-gray-800"/>

                <div class="space-y-4">
                    <h3 class="text-lg font-semibold">
                        Extracted Metadata
                    </h3>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-500 mb-1">Repository</label>
                            <p class="text-base">
                                {{ metadata.repository || 'N/A' }}
                            </p>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-500 mb-1">Shelf Mark</label>
                            <p class="text-base">
                                {{ metadata.shelfMark || 'N/A' }}
                            </p>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-500 mb-1">Dating</label>
                            <p class="text-base">
                                {{ metadata.dating || 'N/A' }}
                            </p>
                        </div>

                        <div v-if="metadata.language">
                            <label class="block text-sm font-medium text-gray-500 mb-1">Language</label>
                            <p class="text-base">
                                {{ metadata.language }}
                            </p>
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-500 mb-1">Full Title</label>
                        <p class="text-base">
                            {{ metadata.title }}
                        </p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-500 mb-1">Generated Filename</label>
                        <code class="block px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                            {{ generatedFilename }}
                        </code>
                    </div>
                </div>

                <hr class="border-gray-200 dark:border-gray-800"/>

                <div class="space-y-4">
                    <h3 class="text-lg font-semibold">
                        Download
                    </h3>

                    <div class="flex flex-wrap gap-3">
                        <UButton
                            :disabled="downloadingXml || downloadingDocx || downloadingPdf"
                            :loading="downloadingXml"
                            icon="i-lucide-download"
                            size="lg"
                            @click="downloadFile('xml')"
                        >
                            Download XML
                        </UButton>

                        <UButton
                            :disabled="downloadingXml || downloadingDocx || downloadingPdf"
                            :loading="downloadingDocx"
                            color="secondary"
                            icon="i-lucide-file-text"
                            size="lg"
                            variant="soft"
                            @click="downloadFile('docx')"
                        >
                            Download DOCX
                        </UButton>

                        <UButton
                            :disabled="downloadingXml || downloadingDocx || downloadingPdf"
                            :loading="downloadingPdf"
                            color="secondary"
                            icon="i-lucide-file"
                            size="lg"
                            variant="soft"
                            @click="downloadFile('pdf')"
                        >
                            Download PDF
                        </UButton>
                    </div>
                </div>
            </div>
        </UPageSection>
    </div>
</template>

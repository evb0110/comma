<script setup>
useHead({
    meta: [
        {
            name: 'viewport',
            content: 'width=device-width, initial-scale=1',
        },
    ],
    link: [
        {
            rel: 'icon',
            href: '/favicon.svg',
            type: 'image/svg+xml',
        },
        {
            rel: 'alternate icon',
            href: '/favicon.ico',
        },
    ],
    htmlAttrs: { lang: 'en' },
})

const title = 'Comma - TEI XML Converter'
const description = 'Convert CoMMA viewer manuscripts from TEI XML to DOCX and PDF formats. Supports large medieval manuscript files with proper metadata extraction and Unicode font support.'

useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogImage: '/og-image.svg',
    twitterImage: '/og-image.svg',
    twitterCard: 'summary_large_image',
})
</script>

<template>
    <UApp>
        <UMain>
            <NuxtPage/>
        </UMain>
    </UApp>
</template>

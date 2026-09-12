import { delay } from './mock/delay'
import { mockContentPages } from './mock/data'

let _pages = [...mockContentPages]

export async function fetchContentPages() {
  await delay()
  return [..._pages]
}

export async function fetchContentPageDetail(slug) {
  if (!slug) throw new Error('slug is required')
  await delay()
  const page = _pages.find(p => p.slug === slug)
  if (!page) throw new Error('Page not found')
  return { ...page }
}

export async function createContentPage(payload) {
  await delay()
  const newPage = {
    id: _pages.length + 1,
    ...payload,
    slug: payload.title?.toLowerCase().replace(/\s+/g, '-') || 'new-page',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  _pages.push(newPage)
  return { ...newPage }
}

export async function updateContentPage(slug, payload) {
  if (!slug) throw new Error('slug is required')
  await delay()
  const idx = _pages.findIndex(p => p.slug === slug)
  if (idx === -1) throw new Error('Page not found')
  _pages[idx] = { ..._pages[idx], ...payload, updated_at: new Date().toISOString() }
  return { ..._pages[idx] }
}

export async function deleteContentPage(slug) {
  if (!slug) throw new Error('slug is required')
  await delay()
  _pages = _pages.filter(p => p.slug !== slug)
  return { detail: 'Deleted.' }
}

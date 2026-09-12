import { delay } from './mock/delay'
import { mockFaqs } from './mock/data'

let _faqs = [...mockFaqs]

export async function fetchFaqs(params = {}) {
  await delay()
  return [..._faqs]
}

export async function fetchFaqDetail(id) {
  if (!id && id !== 0) throw new Error('id is required')
  await delay()
  const faq = _faqs.find(f => f.id === id)
  if (!faq) throw new Error('FAQ not found')
  return { ...faq }
}

export async function createFaq(payload) {
  await delay()
  const newFaq = { id: _faqs.length + 1, ...payload, is_active: true, order: _faqs.length + 1 }
  _faqs.push(newFaq)
  return { ...newFaq }
}

export async function updateFaq(id, payload) {
  if (!id && id !== 0) throw new Error('id is required')
  await delay()
  const idx = _faqs.findIndex(f => f.id === id)
  if (idx === -1) throw new Error('FAQ not found')
  _faqs[idx] = { ..._faqs[idx], ...payload }
  return { ..._faqs[idx] }
}

export async function deleteFaq(id) {
  if (!id && id !== 0) throw new Error('id is required')
  await delay()
  _faqs = _faqs.filter(f => f.id !== id)
  return { detail: 'Deleted.' }
}

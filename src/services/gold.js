import { delay } from './mock/delay'
import { mockCurrencies } from './mock/data'

let _currencies = [...mockCurrencies]

export async function fetchCurrencies() {
  await delay()
  return [..._currencies]
}

export async function fetchCurrencyDetail(slug) {
  if (!slug) throw new Error('slug is required')
  await delay()
  const curr = _currencies.find(c => c.slug === slug)
  if (!curr) throw new Error('Currency not found')
  return { ...curr }
}

export async function createCurrency(payload) {
  await delay()
  const newCurr = { id: _currencies.length + 1, ...payload, last_updated: new Date().toISOString() }
  _currencies.push(newCurr)
  return { ...newCurr }
}

export async function updateCurrency(slug, payload) {
  if (!slug) throw new Error('slug is required')
  await delay()
  const idx = _currencies.findIndex(c => c.slug === slug)
  if (idx === -1) throw new Error('Currency not found')
  _currencies[idx] = { ..._currencies[idx], ...payload, last_updated: new Date().toISOString() }
  return { ..._currencies[idx] }
}

export async function deleteCurrency(slug) {
  if (!slug) throw new Error('slug is required')
  await delay()
  _currencies = _currencies.filter(c => c.slug !== slug)
  return { detail: 'Deleted.' }
}

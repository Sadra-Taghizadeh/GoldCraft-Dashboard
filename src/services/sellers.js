import { delay } from './mock/delay'
import { mockSellers } from './mock/data'

let _sellers = [...mockSellers]

export async function fetchSellers() {
  await delay()
  return [..._sellers]
}

export async function createSeller(data) {
  await delay()
  const newSeller = { id: _sellers.length + 1, ...data, is_active: true, inventory_count: 0, total_sales: 0 }
  _sellers.push(newSeller)
  return { ...newSeller }
}

export async function updateSeller(id, data) {
  await delay()
  const idx = _sellers.findIndex(s => s.id === id)
  if (idx === -1) throw new Error('Seller not found')
  _sellers[idx] = { ..._sellers[idx], ...data }
  return { ..._sellers[idx] }
}

export async function deleteSeller(id) {
  await delay()
  _sellers = _sellers.filter(s => s.id !== id)
  return { detail: 'Deleted.' }
}

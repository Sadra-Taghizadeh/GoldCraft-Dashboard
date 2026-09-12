import { delay } from './mock/delay'
import { mockInventoryTransactions } from './mock/data'

export async function transferToSellerInventory({ sku, fee, fee_type }) {
  await delay()
  return { detail: 'Transfer completed successfully.', transfer_id: Date.now() }
}

export async function manageCentralInventory({ sku, quantity }) {
  await delay()
  return { detail: 'Inventory updated successfully.' }
}

export async function fetchInventoryTransactions({ variant_sku, from_location, to_location } = {}) {
  await delay()
  let result = [...mockInventoryTransactions]

  if (variant_sku) {
    result = result.filter(t => t.variant_sku?.includes(variant_sku))
  }

  if (from_location) {
    result = result.filter(t => t.from_location?.includes(from_location))
  }

  if (to_location) {
    result = result.filter(t => t.to_location?.includes(to_location))
  }

  return result
}

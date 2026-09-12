import { delay } from './mock/delay'
import { mockOrders, mockOrderDetail } from './mock/data'

let _orders = [...mockOrders]

export async function fetchAdminOrders({ status, userId } = {}) {
  await delay()
  let result = [..._orders]

  if (status) {
    result = result.filter(o => o.status === status)
  }

  if (userId !== undefined && userId !== null && `${userId}`.trim() !== '') {
    const uid = `${userId}`.trim()
    result = result.filter(o => `${o.customer_phone}`.includes(uid) || `${o.id}` === uid)
  }

  return result
}

export async function fetchAdminOrderDetail(orderId) {
  if (!orderId && orderId !== 0) throw new Error('orderId is required')
  await delay()
  return { ...mockOrderDetail, id: orderId, order_number: _orders.find(o => o.id === orderId)?.order_number || `ORD-${orderId}` }
}

export async function updateAdminOrderStatus(orderId, status) {
  if (!orderId && orderId !== 0) throw new Error('orderId is required')
  await delay()
  const idx = _orders.findIndex(o => o.id === orderId)
  if (idx !== -1) {
    _orders[idx] = { ..._orders[idx], status }
  }
  return { detail: 'Status updated.', id: orderId, status }
}

import { delay } from './mock/delay'
import { mockTransactions } from './mock/data'

let _transactions = [...mockTransactions]

export async function fetchTransactions({ status, sellerId, paymentMethod } = {}) {
  await delay()
  let result = [..._transactions]

  if (status) {
    result = result.filter(t => t.status === status)
  }

  if (sellerId !== undefined && sellerId !== null && `${sellerId}`.trim() !== '') {
    const sid = `${sellerId}`.trim()
    result = result.filter(t => t.seller_name?.includes(sid) || `${t.id}`.includes(sid))
  }

  if (paymentMethod) {
    result = result.filter(t => t.payment_method === paymentMethod)
  }

  return result
}

export async function returnTransaction(transactionId, notes) {
  await delay()
  const idx = _transactions.findIndex(t => t.id === transactionId)
  if (idx !== -1) {
    _transactions[idx] = { ..._transactions[idx], status: 'refunded' }
  }
  return { detail: 'Transaction returned successfully.' }
}

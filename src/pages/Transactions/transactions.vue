<script setup>
import RowActionsMenu from '@/components/shared/RowActionsMenu.vue'
import TableCardToolbar from '@/components/shared/TableCardToolbar.vue'
import ReturnTransactionDialog from '@/pages/Transactions/components/ReturnTransactionDialog.vue'
import { fetchTransactions } from '@/services/transactions'
import { convertDigits, formatPersianNumber } from '@/utils/currency'

const transactions = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const returnDialogOpen = ref(false)
const selectedTransaction = ref(null)

const filters = ref({
  search: '',
  status: '',
  sellerId: '',
  paymentMethod: '',
})

const statusOptions = [
  { title: 'All', value: '' },
  { title: 'Pending', value: 'pending' },
  { title: 'Completed', value: 'completed' },
  { title: 'Refunded', value: 'refunded' },
  { title: 'Cancelled', value: 'cancelled' },
]

const paymentMethodOptions = [
  { title: 'All', value: '' },
  { title: 'Online', value: 'online' },
  { title: 'Cash', value: 'offline' },
]

const statusLabels = {
  pending: 'Pending',
  completed: 'Completed',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
}

const statusColors = {
  pending: 'warning',
  completed: 'success',
  refunded: 'info',
  cancelled: 'error',
}

const paymentMethodLabels = {
  online: 'Online',
  offline: 'Cash',
}

const rowActions = [
  {
    title: 'Return Transaction',
    value: 'return',
    icon: 'bx-undo',
    disabled: false,
  },
]

const formatDate = value => value || '—'

const getStatusLabel = status => statusLabels[status] || status || '—'
const getStatusColor = status => statusColors[status] || 'secondary'

function formatAmount(amount) {
  const num = Number(amount)

  return isNaN(num) ? '—' : `${formatPersianNumber(num)} Rial`
}

const normalizeText = value => convertDigits(`${value ?? ''}`, 'en').trim().toLowerCase()

const filteredTransactions = computed(() => {
  const search = normalizeText(filters.value.search)

  return transactions.value.filter((tx) => {
    if (!search)
      return true

    return [tx.order_number, tx.customer_name, tx.customer_phone, tx.seller_name, tx.id]
      .some(value => normalizeText(value).includes(search))
  })
})

const hasActiveFilters = computed(() => Boolean(
  normalizeText(filters.value.search)
  || `${filters.value.status ?? ''}`.trim()
  || `${filters.value.sellerId ?? ''}`.trim()
  || `${filters.value.paymentMethod ?? ''}`.trim(),
))

function getRowActions(tx) {
  return rowActions.map(action => ({
    ...action,
    disabled: tx.status !== 'completed',
  }))
}

async function fetchTransactionsData() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const sellerIdValue = `${filters.value.sellerId ?? ''}`.trim()
    const parsedSellerId = sellerIdValue ? Number(sellerIdValue) : undefined

    const response = await fetchTransactions({
      status: filters.value.status || undefined,
      sellerId: Number.isNaN(parsedSellerId) ? sellerIdValue : parsedSellerId,
      paymentMethod: filters.value.paymentMethod || undefined,
    })

    transactions.value = Array.isArray(response) ? response : []
  }
  catch (error) {
    transactions.value = []
    errorMessage.value = error?.response?.data?.detail || 'Unable to load transactions.'
  }
  finally {
    isLoading.value = false
  }
}

function applyFilters() {
  fetchTransactionsData()
}

function resetFilters() {
  filters.value.search = ''
  filters.value.status = ''
  filters.value.sellerId = ''
  filters.value.paymentMethod = ''
  fetchTransactionsData()
}

function openReturnDialog(tx) {
  selectedTransaction.value = tx
  returnDialogOpen.value = true
}

function handleRowAction(tx, action) {
  if (action?.value === 'return') {
    openReturnDialog(tx)
  }
}

async function handleTransactionReturned() {
  await fetchTransactionsData()
}

onMounted(() => {
  fetchTransactionsData()
})
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <TableCardToolbar
          v-model:search="filters.search"
          title="Transactions"
          search-placeholder="Order number, customer, seller, or transaction ID"
        >
          <template #filters>
            <VSelect
              v-model="filters.status"
              :items="statusOptions"
              label="Status"
              density="compact"
              hide-details
              style="min-width: 160px"
            />
            <VSelect
              v-model="filters.paymentMethod"
              :items="paymentMethodOptions"
              label="Payment Method"
              density="compact"
              hide-details
              style="min-width: 160px"
            />
            <VTextField
              v-model="filters.sellerId"
              v-persian-convert
              label="Seller ID"
              type="number"
              density="compact"
              hide-details
              style="min-width: 160px"
            />
          </template>

          <template #actions>
            <VBtn
              color="primary"
              :loading="isLoading"
              @click="applyFilters"
            >
              Apply Filters
            </VBtn>
            <VBtn
              variant="text"
              :disabled="isLoading || !hasActiveFilters"
              @click="resetFilters"
            >
              Clear
            </VBtn>
          </template>
        </TableCardToolbar>

        <VDivider />

        <VCardText>
          <VAlert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            class="mb-4"
          >
            {{ errorMessage }}
          </VAlert>

          <div
            v-if="isLoading && filteredTransactions.length === 0"
            class="d-flex justify-center py-6"
          >
            <VProgressCircular
              indeterminate
              color="primary"
            />
          </div>

          <VTable
            v-else
            class="text-no-wrap"
          >
            <thead>
              <tr>
                <th class="text-uppercase">
                  Transaction ID
                </th>
                <th class="text-uppercase">
                  Order Number
                </th>
                <th class="text-uppercase">
                  Amount
                </th>
                <th class="text-uppercase">
                  Status
                </th>
                <th class="text-uppercase">
                  Payment Method
                </th>
                <th class="text-uppercase">
                  Seller
                </th>
                <th class="text-uppercase">
                  Customer
                </th>
                <th class="text-uppercase">
                  Phone
                </th>
                <th class="text-uppercase">
                  Paid
                </th>
                <th class="text-uppercase">
                  Created Date
                </th>
                <th class="text-uppercase text-end">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredTransactions.length === 0">
                <td
                  colspan="11"
                  class="text-center text-medium-emphasis py-6"
                >
                  {{ hasActiveFilters ? 'No transactions found matching the applied filters.' : 'No transactions to display.' }}
                </td>
              </tr>
              <tr
                v-for="tx in filteredTransactions"
                :key="tx.id"
              >
                <td>
                  {{ tx.id ?? '—' }}
                </td>
                <td>
                  {{ tx.order_number || '—' }}
                </td>
                <td>
                  {{ formatAmount(tx.amount) }}
                </td>
                <td>
                  <VChip
                    size="small"
                    label
                    :color="getStatusColor(tx.status)"
                  >
                    {{ getStatusLabel(tx.status) }}
                  </VChip>
                </td>
                <td>
                  {{ paymentMethodLabels[tx.payment_method] || tx.payment_method || '—' }}
                </td>
                <td>
                  {{ tx.seller_name || '—' }}
                </td>
                <td>
                  {{ tx.customer_name || '—' }}
                </td>
                <td>
                  {{ tx.customer_phone || '—' }}
                </td>
                <td>
                  <VIcon
                    v-if="tx.is_paid"
                    icon="bx-check-circle"
                    color="success"
                    size="22"
                  />
                  <VIcon
                    v-else
                    icon="bx-x-circle"
                    color="error"
                    size="22"
                  />
                </td>
                <td>
                  {{ formatDate(tx.created_at) }}
                </td>
                <td class="text-end">
                  <RowActionsMenu
                    :actions="getRowActions(tx)"
                    @select="action => handleRowAction(tx, action)"
                  />
                </td>
              </tr>
            </tbody>
          </VTable>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <ReturnTransactionDialog
    v-model="returnDialogOpen"
    :transaction="selectedTransaction"
    @returned="handleTransactionReturned"
  />
</template>

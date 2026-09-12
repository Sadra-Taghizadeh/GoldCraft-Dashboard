<script setup>
import RowActionsMenu from '@/components/shared/RowActionsMenu.vue'
import TableCardToolbar from '@/components/shared/TableCardToolbar.vue'
import { fetchTransactions, returnTransaction } from '@/services/transactions'

const transactions = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const filters = ref({
  search: '',
  status: '',
  payment_method: '',
})

const returnDialogOpen = ref(false)
const selectedTransaction = ref(null)
const isReturning = ref(false)
const returnNotes = ref('')

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
  { title: 'Offline', value: 'offline' },
]

const statusMap = {
  pending: { label: 'Pending', color: 'warning' },
  completed: { label: 'Completed', color: 'success' },
  refunded: { label: 'Refunded', color: 'info' },
  cancelled: { label: 'Cancelled', color: 'error' },
}

const paymentMethodMap = {
  online: { label: 'Online', color: 'primary' },
  offline: { label: 'Offline', color: 'secondary' },
}

function getRowActions(tx) {
  const actions = [
    { title: 'Return', value: 'return', icon: 'bx-revision' },
  ]

  return actions
}

function formatCurrency(amount) {
  if (!amount)
    return '—'
  const num = Number(amount)
  if (isNaN(num))
    return amount

  return `${num.toLocaleString('en-US')} Toman`
}

const normalizeText = value => `${value ?? ''}`.trim().toLowerCase()

const filteredTransactions = computed(() => {
  const search = normalizeText(filters.value.search)
  if (!search)
    return transactions.value

  return transactions.value.filter((tx) => {
    return [tx.order_number, tx.seller_name, tx.customer_name, tx.customer_phone, tx.amount]
      .some(value => normalizeText(value).includes(search))
  })
})

const totalTransactions = computed(() => transactions.value.length)

const totalAmount = computed(() => {
  return transactions.value
    .filter(tx => tx.status === 'completed')
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)
})

async function loadTransactions() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const params = {}
    if (filters.value.status)
      params.status = filters.value.status
    if (filters.value.payment_method)
      params.payment_method = filters.value.payment_method

    const response = await fetchTransactions(params)

    transactions.value = Array.isArray(response.results) ? response.results : Array.isArray(response) ? response : []
  }
  catch (error) {
    transactions.value = []
    errorMessage.value = error?.response?.data?.detail || 'Failed to load transactions.'
  }
  finally {
    isLoading.value = false
  }
}

function handleRowAction(tx, action) {
  if (action?.value === 'return') {
    selectedTransaction.value = tx
    returnNotes.value = ''
    returnDialogOpen.value = true
  }
}

async function handleReturn() {
  if (!selectedTransaction.value)
    return

  isReturning.value = true
  errorMessage.value = ''

  try {
    await returnTransaction(selectedTransaction.value.id, returnNotes.value)
    successMessage.value = 'Transaction was successfully returned.'
    returnDialogOpen.value = false
    selectedTransaction.value = null
    returnNotes.value = ''
    await loadTransactions()
    setTimeout(() => { successMessage.value = '' }, 3000)
  }
  catch (error) {
    errorMessage.value = error?.response?.data?.detail || 'Failed to return transaction.'
  }
  finally {
    isReturning.value = false
  }
}

function resetFilters() {
  filters.value.search = ''
  filters.value.status = ''
  filters.value.payment_method = ''
  loadTransactions()
}

onMounted(() => {
  loadTransactions()
})
</script>

<template>
  <VRow>
    <VCol
      cols="12"
      sm="4"
    >
      <VCard>
        <VCardText>
          <div class="d-flex align-center gap-3">
            <VAvatar
              color="primary"
              variant="tonal"
              size="48"
            >
              <VIcon
                icon="bx-credit-card"
                size="24"
              />
            </VAvatar>
            <div>
              <div class="text-caption text-medium-emphasis">
                Total Transactions
              </div>
              <div class="text-h5">
                {{ totalTransactions.toLocaleString() }}
              </div>
            </div>
          </div>
        </VCardText>
      </VCard>
    </VCol>

    <VCol
      cols="12"
      sm="4"
    >
      <VCard>
        <VCardText>
          <div class="d-flex align-center gap-3">
            <VAvatar
              color="success"
              variant="tonal"
              size="48"
            >
              <VIcon
                icon="bx-dollar"
                size="24"
              />
            </VAvatar>
            <div>
              <div class="text-caption text-medium-emphasis">
                Completed Total
              </div>
              <div class="text-h5">
                {{ totalAmount.toLocaleString('en-US') }}
              </div>
            </div>
          </div>
        </VCardText>
      </VCard>
    </VCol>

    <VCol
      cols="12"
      sm="4"
    >
      <VCard>
        <VCardText>
          <div class="d-flex align-center gap-3">
            <VAvatar
              color="warning"
              variant="tonal"
              size="48"
            >
              <VIcon
                icon="bx-check-circle"
                size="24"
              />
            </VAvatar>
            <div>
              <div class="text-caption text-medium-emphasis">
                Completed
              </div>
              <div class="text-h5">
                {{ transactions.filter(t => t.status === 'completed').length.toLocaleString() }}
              </div>
            </div>
          </div>
        </VCardText>
      </VCard>
    </VCol>

    <VCol cols="12">
      <VCard>
        <TableCardToolbar
          v-model:search="filters.search"
          :title="`Transactions (${totalTransactions})`"
          search-placeholder="Order number, customer name, seller"
          search-label="Search"
        >
          <template #filters>
            <VSelect
              v-model="filters.status"
              :items="statusOptions"
              label="Status"
              density="compact"
              hide-details
              style="min-width: 150px"
              @update:model-value="loadTransactions"
            />
            <VSelect
              v-model="filters.payment_method"
              :items="paymentMethodOptions"
              label="Payment Method"
              density="compact"
              hide-details
              style="min-width: 140px"
              @update:model-value="loadTransactions"
            />
          </template>

          <template #actions>
            <VBtn
              variant="text"
              :disabled="!filters.status && !filters.payment_method"
              @click="resetFilters"
            >
              Clear
            </VBtn>
            <VBtn
              variant="text"
              icon="bx-refresh"
              @click="loadTransactions"
            />
          </template>
        </TableCardToolbar>

        <VDivider />

        <VCardText>
          <VAlert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            class="mb-4"
            closable
            @click:close="errorMessage = ''"
          >
            {{ errorMessage }}
          </VAlert>

          <VAlert
            v-if="successMessage"
            type="success"
            variant="tonal"
            class="mb-4"
          >
            {{ successMessage }}
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
                <th class="text-uppercase text-center">
                  Order Number
                </th>
                <th class="text-uppercase text-center">
                  Amount
                </th>
                <th class="text-uppercase text-center">
                  Seller
                </th>
                <th class="text-uppercase text-center">
                  Customer
                </th>
                <th class="text-uppercase text-center">
                  Payment Method
                </th>
                <th class="text-uppercase text-center">
                  Status
                </th>
                <th class="text-uppercase text-center">
                  Paid
                </th>
                <th class="text-uppercase text-center">
                  Date
                </th>
                <th class="text-uppercase text-end">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredTransactions.length === 0">
                <td
                  colspan="9"
                  class="text-center text-medium-emphasis py-6"
                >
                  No transactions found.
                </td>
              </tr>
              <tr
                v-for="tx in filteredTransactions"
                :key="tx.id"
              >
                <td class="text-center">
                  <code class="text-caption">#{{ tx.order_number || tx.order }}</code>
                </td>
                <td class="text-center font-weight-bold">
                  {{ formatCurrency(tx.amount) }}
                </td>
                <td class="text-center">
                  {{ tx.seller_name || '—' }}
                </td>
                <td class="text-center">
                  <div>{{ tx.customer_name || '—' }}</div>
                  <div
                    v-if="tx.customer_phone"
                    class="text-caption text-medium-emphasis"
                    dir="ltr"
                  >
                    {{ tx.customer_phone }}
                  </div>
                </td>
                <td class="text-center">
                  <VChip
                    v-if="paymentMethodMap[tx.payment_method]"
                    size="small"
                    label
                    :color="paymentMethodMap[tx.payment_method].color"
                    variant="tonal"
                  >
                    {{ paymentMethodMap[tx.payment_method].label }}
                  </VChip>
                  <span
                    v-else
                    class="text-medium-emphasis"
                  >—</span>
                </td>
                <td class="text-center">
                  <VChip
                    v-if="statusMap[tx.status]"
                    size="small"
                    label
                    :color="statusMap[tx.status].color"
                    variant="tonal"
                  >
                    {{ statusMap[tx.status].label }}
                  </VChip>
                  <span
                    v-else
                    class="text-medium-emphasis"
                  >—</span>
                </td>
                <td class="text-center">
                  <VIcon
                    v-if="tx.is_paid"
                    icon="bx-check-circle"
                    color="success"
                    size="20"
                  />
                  <VIcon
                    v-else
                    icon="bx-x-circle"
                    color="error"
                    size="20"
                  />
                </td>
                <td class="text-center text-caption">
                  {{ tx.created_at || '—' }}
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

  <VDialog
    v-model="returnDialogOpen"
    max-width="480"
  >
    <VCard class="dialog-card">
      <div class="dialog-header">
        <div class="dialog-header-icon dialog-header-icon--warning">
          <VIcon icon="bx-revision" size="22" />
        </div>
        <div>
          <div class="dialog-title">
            Return Transaction
          </div>
          <div class="dialog-subtitle">
            Order #{{ selectedTransaction?.order_number || selectedTransaction?.order }}
          </div>
        </div>
      </div>

      <VDivider />

      <VCardText class="pa-5">
        <VAlert
          type="warning"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          By returning this transaction, the product will be transferred to the central warehouse.
        </VAlert>

        <div
          v-if="selectedTransaction"
          class="mb-4"
        >
          <div class="d-flex justify-space-between mb-2">
            <span class="text-caption text-medium-emphasis">Amount</span>
            <span class="text-body-2 font-weight-bold">{{ formatCurrency(selectedTransaction.amount) }}</span>
          </div>
          <div class="d-flex justify-space-between mb-2">
            <span class="text-caption text-medium-emphasis">Customer</span>
            <span class="text-body-2">{{ selectedTransaction.customer_name || '—' }}</span>
          </div>
          <div class="d-flex justify-space-between">
            <span class="text-caption text-medium-emphasis">Seller</span>
            <span class="text-body-2">{{ selectedTransaction.seller_name || '—' }}</span>
          </div>
        </div>

        <VTextField
          v-model="returnNotes"
          label="Return notes (optional)"
          density="comfortable"
          variant="outlined"
          prepend-inner-icon="bx-note"
          rounded="lg"
          rows="3"
          auto-grow
        />
      </VCardText>

      <VDivider />

      <VCardActions class="dialog-actions">
        <VBtn
          variant="outlined"
          size="large"
          rounded="lg"
          :disabled="isReturning"
          @click="returnDialogOpen = false"
        >
          Cancel
        </VBtn>
        <VBtn
          color="error"
          variant="flat"
          size="large"
          rounded="lg"
          :loading="isReturning"
          @click="handleReturn"
        >
          <VIcon
            start
            icon="bx-revision"
          />
          Return
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.dialog-card {
  border-radius: 20px !important;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 24px;
}

.dialog-header-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dialog-header-icon--warning {
  background: rgba(var(--v-theme-warning), 0.1);
  color: rgb(var(--v-theme-warning));
}

.dialog-title {
  font-size: 1.1rem;
  font-weight: 700;
}

.dialog-subtitle {
  font-size: 0.78rem;
  color: rgba(0, 0, 0, 0.4);
  margin-top: 2px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px !important;
}
</style>

<script setup>
import { formatPhoneNumber } from '@/@core/utils/formatters'
import RowActionsMenu from '@/components/shared/RowActionsMenu.vue'
import TableCardToolbar from '@/components/shared/TableCardToolbar.vue'
import OrderDetailDialog from '@/pages/Orders/components/OrderDetailDialog.vue'
import OrderStatusDialog from '@/pages/Orders/components/OrderStatusDialog.vue'
import { fetchAdminOrders, updateAdminOrderStatus } from '@/services/orders'
import { convertDigits } from '@/utils/currency'

const orders = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const detailDialogOpen = ref(false)
const statusDialogOpen = ref(false)
const selectedOrder = ref(null)
const updatingOrderId = ref(null)

const inlineStatusOptions = [
  { title: 'Draft', value: 'draft' },
  { title: 'Submitted', value: 'submitted' },
  { title: 'In Progress', value: 'in_progress' },
  { title: 'Completed', value: 'completed' },
  { title: 'Cancelled', value: 'cancelled' },
]

const filters = ref({
  search: '',
  status: '',
  userId: '',
})

const statusOptions = [
  { title: 'All', value: '' },
  { title: 'Draft', value: 'draft' },
  { title: 'Submitted', value: 'submitted' },
  { title: 'In Progress', value: 'in_progress' },
  { title: 'Completed', value: 'completed' },
  { title: 'Cancelled', value: 'cancelled' },
]

const statusLabels = {
  draft: 'Draft',
  submitted: 'Submitted',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const statusColors = {
  draft: 'secondary',
  submitted: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'error',
}

const rowActions = [
  {
    title: 'Details',
    value: 'detail',
    icon: 'bx-show',
  },
  {
    title: 'Change Status',
    value: 'status',
    icon: 'bx-transfer-alt',
  },
]

const formatDate = value => value || '—'

const getStatusLabel = status => statusLabels[status] || status || '—'
const getStatusColor = status => statusColors[status] || 'secondary'

const normalizeText = value => convertDigits(`${value ?? ''}`, 'en').trim().toLowerCase()

const filteredOrders = computed(() => {
  const search = normalizeText(filters.value.search)

  return orders.value.filter((order) => {
    if (!search)
      return true

    return [order.order_number, order.id, order.customer_name, order.customer_phone]
      .some(value => normalizeText(value).includes(search))
  })
})

const hasActiveFilters = computed(() => Boolean(
  normalizeText(filters.value.search)
  || `${filters.value.status ?? ''}`.trim()
  || `${filters.value.userId ?? ''}`.trim(),
))

async function fetchOrders() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const userIdValue = `${filters.value.userId ?? ''}`.trim()
    const parsedUserId = userIdValue ? Number(userIdValue) : undefined

    const response = await fetchAdminOrders({
      status: filters.value.status || undefined,
      userId: Number.isNaN(parsedUserId) ? userIdValue : parsedUserId,
    })

    orders.value = Array.isArray(response) ? response : []
  }
  catch (error) {
    orders.value = []
    errorMessage.value = error?.response?.data?.detail || 'Failed to load orders.'
  }
  finally {
    isLoading.value = false
  }
}

function applyFilters() {
  fetchOrders()
}

function resetFilters() {
  filters.value.search = ''
  filters.value.status = ''
  filters.value.userId = ''
  fetchOrders()
}

function openOrderDetail(order) {
  selectedOrder.value = order
  detailDialogOpen.value = true
}

function openOrderStatusDialog(order) {
  selectedOrder.value = order
  statusDialogOpen.value = true
}

function handleRowAction(order, action) {
  if (action?.value === 'detail') {
    openOrderDetail(order)

    return
  }

  if (action?.value === 'status') {
    openOrderStatusDialog(order)
  }
}

async function handleQuickStatusChange(order, newStatus) {
  if (newStatus === order.status)
    return
  updatingOrderId.value = order.id
  try {
    await updateAdminOrderStatus(order.id, newStatus)
    await fetchOrders()
  }
  catch (error) {
    errorMessage.value = error?.response?.data?.detail || 'Failed to update status.'
  }
  finally {
    updatingOrderId.value = null
  }
}

async function handleOrderUpdated() {
  await fetchOrders()
}

onMounted(() => {
  fetchOrders()
})
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <TableCardToolbar
          v-model:search="filters.search"
          title="Orders"
          search-placeholder="Order number, customer, or phone"
        >
          <template #filters>
            <VSelect
              v-model="filters.status"
              :items="statusOptions"
              label="Status"
              density="compact"
              hide-details
              style="min-width: 180px"
            />
            <VTextField
              v-model="filters.userId"
              v-persian-convert
              label="User ID"
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
            v-if="isLoading && filteredOrders.length === 0"
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
                  Order Number
                </th>
                <th class="text-uppercase">
                  Status
                </th>
                <th class="text-uppercase">
                  Items Count
                </th>
                <th class="text-uppercase">
                  Customer Name
                </th>
                <th class="text-uppercase">
                  Phone Number
                </th>
                <th class="text-uppercase">
                  Created Date
                </th>
                <th class="text-uppercase">
                  Submitted Date
                </th>
                <th class="text-uppercase">
                  Completed Date
                </th>
                <th class="text-uppercase text-end">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredOrders.length === 0">
                <td
                  colspan="9"
                  class="text-center text-medium-emphasis py-6"
                >
                  {{ hasActiveFilters ? 'No orders found with the applied filters.' : 'No orders to display.' }}
                </td>
              </tr>
              <tr
                v-for="order in filteredOrders"
                :key="order.id"
              >
                <td>
                  {{ order.order_number || order.id || '—' }}
                </td>
                <td>
                  <VSelect
                    :model-value="order.status"
                    :items="inlineStatusOptions"
                    :color="getStatusColor(order.status)"
                    :loading="updatingOrderId === order.id"
                    density="compact"
                    hide-details
                    variant="plain"
                    class="status-select"
                    item-title="title"
                    item-value="value"
                    @update:model-value="val => handleQuickStatusChange(order, val)"
                  >
                    <template #selection="{ item }">
                      <VChip
                        size="small"
                        label
                        :color="getStatusColor(item.value)"
                      >
                        {{ item.title }}
                      </VChip>
                    </template>
                  </VSelect>
                </td>
                <td>
                  {{ order.items_count ?? '—' }}
                </td>
                <td>
                  {{ order.customer_name || '—' }}
                </td>
                <td>
                  {{ formatPhoneNumber(order.customer_phone) || '—' }}
                </td>
                <td>
                  {{ formatDate(order.created_at) }}
                </td>
                <td>
                  {{ formatDate(order.submitted_at) }}
                </td>
                <td>
                  {{ formatDate(order.completed_at) }}
                </td>
                <td class="text-end">
                  <RowActionsMenu
                    :actions="rowActions"
                    @select="action => handleRowAction(order, action)"
                  />
                </td>
              </tr>
            </tbody>
          </VTable>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <OrderDetailDialog
    v-model="detailDialogOpen"
    :order-id="selectedOrder?.id"
  />

  <OrderStatusDialog
    v-model="statusDialogOpen"
    :order="selectedOrder"
    @updated="handleOrderUpdated"
  />
</template>

<style scoped>
.status-select :deep(.v-select__dropdown-icon),
.status-select :deep(.v-field__append-inner) {
  display: none;
}
</style>

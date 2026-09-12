<script setup>
import { formatPhoneNumber } from '@/@core/utils/formatters'
import { fetchAdminOrderDetail } from '@/services/orders'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  orderId: {
    type: [Number, String],
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

const isLoading = ref(false)
const errorMessage = ref('')
const orderDetail = ref(null)

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

const formatDateTime = value => value || '—'

function formatNumber(value) {
  if (value === null || value === undefined || value === '')
    return '—'

  return new Intl.NumberFormat('en-US').format(Number(value))
}

const getStatusLabel = status => statusLabels[status] || status || '—'
const getStatusColor = status => statusColors[status] || 'secondary'

async function loadOrderDetail() {
  if (!props.orderId && props.orderId !== 0)
    return

  isLoading.value = true
  errorMessage.value = ''

  try {
    orderDetail.value = await fetchAdminOrderDetail(props.orderId)
  }
  catch (error) {
    orderDetail.value = null
    errorMessage.value = error?.response?.data?.detail || 'Failed to load order details.'
  }
  finally {
    isLoading.value = false
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      loadOrderDetail()
    }
    else {
      errorMessage.value = ''
    }
  },
)

watch(
  () => props.orderId,
  () => {
    if (props.modelValue) {
      loadOrderDetail()
    }
  },
)

function handleClose() {
  emit('update:modelValue', false)
}
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="900"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between gap-4 flex-wrap">
        <div>
          <div class="text-h6">
            Order Details
          </div>
          <div class="text-body-2 text-medium-emphasis">
            {{ orderDetail?.order_number || '—' }}
          </div>
        </div>

        <VChip
          v-if="orderDetail"
          size="small"
          label
          :color="getStatusColor(orderDetail.status)"
        >
          {{ getStatusLabel(orderDetail.status) }}
        </VChip>
      </VCardTitle>

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
          v-if="isLoading"
          class="d-flex justify-center py-8"
        >
          <VProgressCircular
            indeterminate
            color="primary"
          />
        </div>

        <template v-else-if="orderDetail">
          <VRow class="mb-4">
            <VCol
              cols="12"
              md="3"
            >
              <div class="text-body-2 text-medium-emphasis">
                Customer Name
              </div>
              <div class="text-body-1 font-weight-medium">
                {{ orderDetail.customer_name || '—' }}
              </div>
            </VCol>
            <VCol
              cols="12"
              md="3"
            >
              <div class="text-body-2 text-medium-emphasis">
                Phone Number
              </div>
              <div class="text-body-1 font-weight-medium ltr">
                {{ formatPhoneNumber(orderDetail.customer_phone) || '—' }}
              </div>
            </VCol>
            <VCol
              cols="12"
              md="3"
            >
              <div class="text-body-2 text-medium-emphasis">
                Order Date
              </div>
              <div class="text-body-1 font-weight-medium">
                {{ formatDateTime(orderDetail.created_at) }}
              </div>
            </VCol>
            <VCol
              cols="12"
              md="3"
            >
              <div class="text-body-2 text-medium-emphasis">
                Total Workmanship Fee
              </div>
              <div class="text-body-1 font-weight-medium">
                {{ formatNumber(orderDetail.total_workmanship_fee) }}
              </div>
            </VCol>
          </VRow>

          <VAlert
            v-if="orderDetail.notes"
            type="info"
            variant="tonal"
            class="mb-4"
          >
            <div class="text-body-2 mb-1">
              Order Notes
            </div>
            {{ orderDetail.notes }}
          </VAlert>

          <div class="text-subtitle-1 font-weight-semibold mb-3">
            Order Items
          </div>

          <VTable class="text-no-wrap">
            <thead>
              <tr>
                <th class="text-uppercase">
                  Product
                </th>
                <th class="text-uppercase">
                  SKU Code
                </th>
                <th class="text-uppercase">
                  Quantity
                </th>
                <th class="text-uppercase">
                  Weight
                </th>
                <th class="text-uppercase">
                  Workmanship Fee
                </th>
                <th class="text-uppercase">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in orderDetail.items || []"
                :key="item.id"
              >
                <td>
                  {{ item.variant?.product_name || '—' }}
                </td>
                <td>
                  {{ item.variant?.sku || '—' }}
                </td>
                <td>
                  {{ formatNumber(item.quantity) }}
                </td>
                <td>
                  {{ item.weight || '—' }}
                </td>
                <td>
                  {{ formatNumber(item.workmanship_fee_total) }}
                </td>
                <td>
                  {{ item.bracket_description || '—' }}
                </td>
              </tr>
              <tr v-if="!orderDetail.items || orderDetail.items.length === 0">
                <td
                  colspan="6"
                  class="text-center text-medium-emphasis py-6"
                >
                  No items to display.
                </td>
              </tr>
            </tbody>
          </VTable>
        </template>
      </VCardText>

      <VDivider />

      <VCardActions class="justify-end gap-2">
        <VBtn
          color="primary"
          variant="tonal"
          @click="handleClose"
        >
          Close
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

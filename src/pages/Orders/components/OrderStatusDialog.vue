<script setup>
import { updateAdminOrderStatus } from '@/services/orders'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  order: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'updated'])

const isLoading = ref(false)
const errorMessage = ref('')
const selectedStatus = ref('draft')

const statusOptions = [
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

const getStatusLabel = status => statusLabels[status] || status || '—'
const getStatusColor = status => statusColors[status] || 'secondary'

function syncFormState() {
  selectedStatus.value = props.order?.status || 'draft'
  errorMessage.value = ''
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      syncFormState()
    }
  },
)

watch(
  () => props.order,
  () => {
    if (props.modelValue) {
      syncFormState()
    }
  },
  { deep: true },
)

function handleClose() {
  emit('update:modelValue', false)
}

async function handleSubmit() {
  if (!props.order?.id)
    return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const updatedOrder = await updateAdminOrderStatus(props.order.id, selectedStatus.value)

    emit('updated', updatedOrder)
    emit('update:modelValue', false)
  }
  catch (error) {
    errorMessage.value = error?.response?.data?.detail || 'Failed to update order status.'
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="520"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between gap-4 flex-wrap">
        <div>
          <div class="text-h6">
            Change Order Status
          </div>
          <div class="text-body-2 text-medium-emphasis">
            {{ order?.order_number || '—' }}
          </div>
        </div>

        <VChip
          v-if="order"
          size="small"
          label
          :color="getStatusColor(order.status)"
        >
          {{ getStatusLabel(order.status) }}
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

        <VSelect
          v-model="selectedStatus"
          :items="statusOptions"
          label="New Status"
          variant="outlined"
          hide-details
        />
      </VCardText>

      <VDivider />

      <VCardActions class="justify-end gap-2">
        <VBtn
          variant="text"
          :disabled="isLoading"
          @click="handleClose"
        >
          Cancel
        </VBtn>

        <VBtn
          color="primary"
          :loading="isLoading"
          @click="handleSubmit"
        >
          Save Changes
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

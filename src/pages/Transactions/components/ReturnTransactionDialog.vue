<script setup>
import { returnTransaction } from '@/services/transactions'

const props = defineProps({
  transaction: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['returned', 'update:modelValue'])

const notes = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

async function handleReturn() {
  if (!props.transaction)
    return

  isLoading.value = true
  errorMessage.value = ''

  try {
    await returnTransaction(props.transaction.id, notes.value)
    emit('returned')
    emit('update:modelValue', false)
    notes.value = ''
  }
  catch (error) {
    errorMessage.value = error?.response?.data?.detail || 'Unable to return transaction.'
  }
  finally {
    isLoading.value = false
  }
}

function handleClose() {
  notes.value = ''
  errorMessage.value = ''
}
</script>

<template>
  <VDialog
    :model-value="!!transaction"
    max-width="500"
    @update:model-value="val => { if (!val) handleClose() }"
  >
    <VCard v-if="transaction">
      <VCardTitle class="d-flex align-center justify-space-between">
        <span>Return Transaction</span>
        <VBtn
          icon
          variant="text"
          size="small"
          @click="emit('update:modelValue', false)"
        >
          <VIcon icon="bx-x" />
        </VBtn>
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

        <div class="mb-4">
          <div class="text-medium-emphasis mb-1">
            Transaction ID: <strong>{{ transaction.id }}</strong>
          </div>
          <div class="text-medium-emphasis mb-1">
            Order Number: <strong>{{ transaction.order_number || '—' }}</strong>
          </div>
          <div class="text-medium-emphasis mb-1">
            Amount: <strong>{{ Number(transaction.amount).toLocaleString('en-US') }} {{ transaction.currency }}</strong>
          </div>
          <div class="text-medium-emphasis">
            Customer: <strong>{{ transaction.customer_name || '—' }}</strong>
          </div>
        </div>

        <VAlert
          type="warning"
          variant="tonal"
          class="mb-4"
        >
          By returning this transaction, the item will be transferred to the central warehouse and the transaction status will change to "Refunded".
        </VAlert>

        <VTextarea
          v-model="notes"
          label="Return Notes"
          rows="3"
          hide-details
          auto-grow
        />
      </VCardText>

      <VCardActions class="pa-4">
        <VSpacer />
        <VBtn
          variant="text"
          @click="emit('update:modelValue', false)"
        >
          Cancel
        </VBtn>
        <VBtn
          color="error"
          :loading="isLoading"
          @click="handleReturn"
        >
          Return Transaction
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

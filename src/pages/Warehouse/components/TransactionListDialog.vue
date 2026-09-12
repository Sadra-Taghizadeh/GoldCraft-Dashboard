<script setup>
import { fetchInventoryTransactions } from '@/services/inventory'

const props = defineProps({
  productName: {
    type: String,
    default: '',
  },
})

const dialogModel = defineModel({ type: Boolean, default: false })

const transactions = ref([])
const isLoading = ref(false)
const errorMessage = ref('')

async function loadTransactions() {
  isLoading.value = true
  errorMessage.value = ''
  transactions.value = []

  try {
    const response = await fetchInventoryTransactions()
    const all = Array.isArray(response) ? response : Array.isArray(response?.results) ? response.results : Array.isArray(response?.data) ? response.data : []

    if (props.productName) {
      const needle = props.productName.trim()

      transactions.value = all.filter((t) => {
        const name = t.variant?.product_name ?? ''

        return name.trim() === needle || name.includes(needle) || needle.includes(name)
      })
    }
    else {
      transactions.value = all
    }
  }
  catch (error) {
    errorMessage.value = error?.response?.data?.detail || 'Unable to load transactions.'
  }
  finally {
    isLoading.value = false
  }
}

watch(dialogModel, (open) => {
  if (open) {
    loadTransactions()
  }
  else {
    transactions.value = []
    errorMessage.value = ''
  }
})

watch(() => props.productName, () => {
  if (dialogModel.value) {
    loadTransactions()
  }
})

function formatDate(dateStr) {
  if (!dateStr)
    return '—'
  const d = new Date(dateStr)

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatQuantity(qty) {
  if (qty == null)
    return '—'

  return qty > 0 ? `+${qty}` : `${qty}`
}
</script>

<template>
  <VDialog
    v-model="dialogModel"
    max-width="800"
    scrollable
  >
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between gap-4 flex-wrap pa-5">
        <div class="d-flex align-center gap-3">
          <VAvatar
            color="success"
            variant="tonal"
            size="44"
          >
            <VIcon
              icon="bx-transfer"
              size="22"
            />
          </VAvatar>
          <div>
            <div class="text-h6">
              Warehouse Transactions
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ productName }}
            </div>
          </div>
        </div>
        <VChip
          v-if="transactions.length"
          size="small"
          color="success"
          variant="tonal"
        >
          {{ transactions.length }} Transactions
        </VChip>
      </VCardTitle>

      <VDivider />

      <VCardText>
        <div
          v-if="isLoading"
          class="d-flex justify-center py-8"
        >
          <VProgressCircular
            indeterminate
            color="primary"
          />
        </div>

        <VAlert
          v-else-if="errorMessage"
          type="error"
          variant="tonal"
        >
          {{ errorMessage }}
        </VAlert>

        <template v-else>
          <div
            v-if="transactions.length === 0"
            class="text-center text-medium-emphasis py-8"
          >
            No transactions found for this product.
          </div>

          <VTable
            v-else
            class="text-no-wrap"
          >
            <thead>
              <tr>
                <th class="text-uppercase">
                  SKU
                </th>
                <th class="text-uppercase">
                  Variant
                </th>
                <th class="text-uppercase text-center">
                  Quantity
                </th>
                <th class="text-uppercase text-center">
                  From
                </th>
                <th class="text-uppercase text-center">
                  To
                </th>
                <th class="text-uppercase text-center">
                  Fee
                </th>
                <th class="text-uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="tx in transactions"
                :key="tx.id"
              >
                <td>
                  <code class="text-caption">{{ tx.variant?.sku || '—' }}</code>
                </td>
                <td>
                  {{ tx.variant?.product_name || '—' }}
                </td>
                <td class="text-center">
                  <VChip
                    size="small"
                    label
                    :color="tx.quantity > 0 ? 'success' : 'error'"
                    variant="tonal"
                  >
                    {{ formatQuantity(tx.quantity) }}
                  </VChip>
                </td>
                <td class="text-center">
                  {{ tx.from_location?.name || '—' }}
                </td>
                <td class="text-center">
                  {{ tx.to_location?.name || '—' }}
                </td>
                <td class="text-center">
                  <template v-if="tx.workmanship_fee != null">
                    {{ tx.workmanship_fee?.toLocaleString() }}
                    <span class="text-caption text-medium-emphasis">{{ tx.fee_type === 'fixed' ? 'IRR' : '%' }}</span>
                  </template>
                  <span
                    v-else
                    class="text-medium-emphasis"
                  >—</span>
                </td>
                <td>
                  <span class="text-caption">{{ formatDate(tx.created_at) }}</span>
                </td>
              </tr>
            </tbody>
          </VTable>
        </template>
      </VCardText>

      <VDivider />

      <VCardActions class="justify-end pa-5">
        <VBtn
          variant="outlined"
          size="large"
          @click="dialogModel = false"
        >
          Close
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

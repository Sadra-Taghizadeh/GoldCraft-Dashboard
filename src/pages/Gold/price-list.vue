<script setup>
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog.vue'
import RowActionsMenu from '@/components/shared/RowActionsMenu.vue'
import TableCardToolbar from '@/components/shared/TableCardToolbar.vue'
import CurrencyFormDialog from '@/pages/Gold/components/CurrencyFormDialog.vue'
import {
  createCurrency,
  deleteCurrency,
  fetchCurrencies,
  updateCurrency,
} from '@/services/gold'
import { convertDigits, fetchCurrencyRates, formatChangePercent, formatPersianNumber } from '@/utils/currency'

const displayRates = ref([])
const currencies = ref([])
const filters = ref({ search: '' })
const isLoading = ref(false)
const isLoadingRates = ref(true)
const ratesError = ref('')
const errorMessage = ref('')
const formDialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const currencyToDelete = ref(null)
const selectedCurrency = ref(null)

const rowActions = [
  { title: 'Edit', value: 'edit', icon: 'bx-edit' },
  { title: 'Delete', value: 'delete', icon: 'bx-trash' },
]

const normalizeText = value => convertDigits(`${value ?? ''}`, 'en').trim().toLowerCase()

const filteredCurrencies = computed(() => {
  const search = normalizeText(filters.value.search)

  if (!search)
    return currencies.value

  return currencies.value.filter(
    item => [item.name, item.slug].some(value => normalizeText(value).includes(search)),
  )
})

const hasActiveFilters = computed(() => Boolean(normalizeText(filters.value.search)))

async function fetchLiveRates() {
  isLoadingRates.value = true
  ratesError.value = ''

  try {
    const rates = await fetchCurrencyRates()

    const priorityCodes = ['usd', 'eur', 'gold_18k', 'gold_24k', 'gold_melted', 'gold_ounce', 'coin_emami', 'coin_bahar', 'try', 'aed', 'gbp', 'sar']

    displayRates.value = priorityCodes
      .filter(code => rates[code])
      .map(code => rates[code])
  }
  catch (error) {
    ratesError.value = error?.message || 'Unable to fetch rates.'
    displayRates.value = []
  }
  finally {
    isLoadingRates.value = false
  }
}

async function fetchPageData() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await fetchCurrencies()

    currencies.value = Array.isArray(response) ? response : []
  }
  catch (error) {
    currencies.value = []
    errorMessage.value = error?.response?.data?.detail || 'Unable to load currencies.'
  }
  finally {
    isLoading.value = false
  }
}

function resetFilters() {
  filters.value.search = ''
}

function openCreateDialog() {
  selectedCurrency.value = null
  formDialogOpen.value = true
}

function openEditDialog(currency) {
  selectedCurrency.value = currency
  formDialogOpen.value = true
}

function handleRowAction(currency, action) {
  if (action?.value === 'edit')
    return openEditDialog(currency)
  if (action?.value === 'delete')
    return handleDelete(currency)
}

async function handleDelete(currency) {
  currencyToDelete.value = currency
  deleteDialogOpen.value = true
}

async function confirmDelete() {
  if (!currencyToDelete.value?.id && currencyToDelete.value?.id !== 0)
    return

  try {
    await deleteCurrency(currencyToDelete.value.slug)
    await fetchPageData()
    deleteDialogOpen.value = false
    currencyToDelete.value = null
  }
  catch (error) {
    errorMessage.value = error?.response?.data?.detail || 'Unable to delete currency.'
  }
}

async function handleSave(payload) {
  try {
    if (selectedCurrency.value?.slug) {
      await updateCurrency(selectedCurrency.value.slug, payload)
    }
    else {
      await createCurrency(payload)
    }

    formDialogOpen.value = false
    selectedCurrency.value = null
    await fetchPageData()
  }
  catch (error) {
    errorMessage.value = error?.response?.data?.detail || 'Unable to save currency.'
  }
}

onMounted(() => {
  fetchPageData()
  fetchLiveRates()
})
</script>

<template>
  <VRow>
    <VCol cols="12">
      <h4 class="text-h4 mb-6">
        Rate List
      </h4>
    </VCol>

    <VCol cols="12">
      <VRow
        v-if="isLoadingRates && displayRates.length === 0"
        class="mb-4"
      >
        <VCol
          v-for="i in 12"
          :key="i"
          cols="6"
          sm="4"
          md="3"
          lg="2"
        >
          <VSkeletonLoader
            class="mx-auto border rounded"
            type="heading,paragraph,chip"
            :boilerplate="false"
          />
        </VCol>
      </VRow>

      <VAlert
        v-else-if="ratesError"
        type="warning"
        variant="tonal"
        class="mb-4"
      >
        {{ ratesError }}
      </VAlert>

      <VRow
        v-else
        class="mb-4"
      >
        <VCol
          v-for="rate in displayRates"
          :key="rate.code"
          cols="6"
          sm="4"
          md="3"
          lg="2"
        >
          <VCard
            class="rate-card"
            :class="rate.type === 'gold' ? 'rate-card--gold' : 'rate-card--currency'"
          >
            <VCardText class="d-flex flex-column pa-3">
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-caption text-medium-emphasis font-weight-medium">{{ rate.name }}</span>
                <VChip
                  size="x-small"
                  label
                  :color="rate.type === 'gold' ? 'amber-darken-2' : 'primary'"
                  variant="flat"
                  class="font-weight-bold text-white"
                >
                  {{ rate.type === 'gold' ? 'Gold' : 'Currency' }}
                </VChip>
              </div>
              <div class="text-h6 font-weight-bold mb-2 text-primary">
                {{ formatPersianNumber(rate.value) }}
              </div>
              <div class="d-flex align-center justify-space-between">
                <VChip
                  size="x-small"
                  label
                  :color="parseFloat(rate.changePercent) >= 0 ? 'success' : 'error'"
                  variant="tonal"
                  class="font-weight-bold"
                  :prepend-icon="parseFloat(rate.changePercent) >= 0 ? 'bx-trending-up' : 'bx-trending-down'"
                >
                  {{ formatChangePercent(rate.changePercent) }}
                </VChip>
                <span class="text-caption text-disabled">{{ rate.unit }}</span>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </VCol>

    <VCol cols="12">
      <VCard>
        <TableCardToolbar
          v-model:search="filters.search"
          title="Custom Currencies"
          search-placeholder="Name or Code"
        >
          <template #actions>
            <VBtn
              variant="text"
              :disabled="!hasActiveFilters"
              @click="resetFilters"
            >
              Clear
            </VBtn>
            <VBtn
              color="primary"
              @click="openCreateDialog"
            >
              Add Currency
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
            v-if="isLoading && currencies.length === 0"
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
                  Name
                </th>
                <th class="text-uppercase">
                  Code
                </th>
                <th class="text-uppercase">
                  Price
                </th>
                <th class="text-uppercase text-end">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredCurrencies.length === 0">
                <td
                  colspan="4"
                  class="text-center text-medium-emphasis py-6"
                >
                  {{ hasActiveFilters ? 'No currencies found matching the applied filters.' : 'No currencies to display.' }}
                </td>
              </tr>
              <tr
                v-for="currency in filteredCurrencies"
                :key="currency.id"
              >
                <td>{{ currency.name || '—' }}</td>
                <td><code>{{ currency.slug || '—' }}</code></td>
                <td>{{ currency.price ? formatPersianNumber(currency.price) : '—' }}</td>
                <td class="text-end">
                  <RowActionsMenu
                    :actions="rowActions"
                    @select="action => handleRowAction(currency, action)"
                  />
                </td>
              </tr>
            </tbody>
          </VTable>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <CurrencyFormDialog
    v-model="formDialogOpen"
    :currency="selectedCurrency"
    @save="handleSave"
  />

  <DeleteConfirmDialog
    v-model="deleteDialogOpen"
    title="Delete Currency"
    :message="`Are you sure you want to delete the currency '${currencyToDelete?.name || ''}'?`"
    confirm-text="Delete Currency"
    :loading="isLoading"
    @confirm="confirmDelete"
  />
</template>

<style lang="scss" scoped>
.rate-card {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  cursor: default;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    opacity: 0.04;
  }

  &--gold::before {
    background: linear-gradient(135deg, rgb(255, 193, 7), rgb(245, 124, 0));
  }

  &--currency::before {
    background: linear-gradient(135deg, rgb(33, 150, 243), rgb(63, 81, 181));
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12) !important;
  }
}
</style>

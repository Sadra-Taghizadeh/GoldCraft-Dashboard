<script setup>
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog.vue'
import RowActionsMenu from '@/components/shared/RowActionsMenu.vue'
import TableCardToolbar from '@/components/shared/TableCardToolbar.vue'
import FaqDetailDialog from '@/pages/Contents/components/FaqDetailDialog.vue'
import FaqFormDialog from '@/pages/Contents/components/FaqFormDialog.vue'
import {
  createFaq,
  deleteFaq,
  fetchFaqs,
  updateFaq,
} from '@/services/faqs'
import { fetchProducts } from '@/services/products'
import { convertDigits } from '@/utils/currency'

const faqs = ref([])
const products = ref([])

const filters = ref({
  search: '',
  productId: '',
  isDefault: 'all',
})

const isLoading = ref(false)
const errorMessage = ref('')
const detailDialogOpen = ref(false)
const formDialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const faqToDelete = ref(null)
const selectedFaq = ref(null)

const rowActions = [
  { title: 'Details', value: 'detail', icon: 'bx-show' },
  { title: 'Edit', value: 'edit', icon: 'bx-edit' },
  { title: 'Delete', value: 'delete', icon: 'bx-trash' },
]

const isDefaultOptions = [
  { title: 'All', value: 'all' },
  { title: 'Public (Default)', value: 'true' },
  { title: 'Specific', value: 'false' },
]

const productOptions = computed(() => [
  { title: 'All Products', value: '' },
  ...products.value.map(p => ({
    title: p.name,
    value: p.id,
  })),
])

const normalizeText = value => convertDigits(`${value ?? ''}`, 'en').trim().toLowerCase()

const filteredFaqs = computed(() => {
  const search = normalizeText(filters.value.search)

  if (!search)
    return faqs.value

  return faqs.value.filter(faq => [faq.question, faq.answer].some(value => normalizeText(value).includes(search)))
})

const hasActiveFilters = computed(() => Boolean(
  normalizeText(filters.value.search)
  || `${filters.value.productId ?? ''}`.trim()
  || filters.value.isDefault !== 'all',
))

const productMap = computed(() => {
  const map = new Map()

  products.value.forEach(p => map.set(p.id, p.name))

  return map
})

async function fetchAllFaqs() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const params = {}

    if (filters.value.productId)
      params.product_id = filters.value.productId

    if (filters.value.isDefault !== 'all')
      params.is_default = filters.value.isDefault

    const [faqResponse, productResponse] = await Promise.all([
      fetchFaqs(params),
      fetchProducts(),
    ])

    faqs.value = Array.isArray(faqResponse) ? faqResponse : []
    products.value = Array.isArray(productResponse) ? productResponse : []
  }
  catch (error) {
    faqs.value = []
    products.value = []
    errorMessage.value = error?.response?.data?.detail || 'Unable to load FAQ.'
  }
  finally {
    isLoading.value = false
  }
}

function resetFilters() {
  filters.value.search = ''
  filters.value.productId = ''
  filters.value.isDefault = 'all'
  fetchAllFaqs()
}

function openCreateDialog() {
  selectedFaq.value = null
  formDialogOpen.value = true
}

function openEditDialog(faq) {
  selectedFaq.value = faq
  formDialogOpen.value = true
}

function openDetailDialog(faq) {
  selectedFaq.value = faq
  detailDialogOpen.value = true
}

function handleRowAction(faq, action) {
  if (action?.value === 'detail')
    return openDetailDialog(faq)
  if (action?.value === 'edit')
    return openEditDialog(faq)
  if (action?.value === 'delete')
    return handleDelete(faq)
}

function handleDelete(faq) {
  faqToDelete.value = faq
  deleteDialogOpen.value = true
}

async function confirmDelete() {
  if (!faqToDelete.value?.id && faqToDelete.value?.id !== 0)
    return

  try {
    await deleteFaq(faqToDelete.value.id)
    await fetchAllFaqs()
    deleteDialogOpen.value = false
    faqToDelete.value = null
  }
  catch (error) {
    errorMessage.value = error?.response?.data?.detail || 'Unable to delete FAQ.'
  }
}

async function handleSave(payload) {
  try {
    if (selectedFaq.value?.id || selectedFaq.value?.id === 0) {
      await updateFaq(selectedFaq.value.id, payload)
    }
    else {
      await createFaq(payload)
    }

    formDialogOpen.value = false
    selectedFaq.value = null
    await fetchAllFaqs()
  }
  catch (error) {
    errorMessage.value = error?.response?.data?.detail || 'Unable to save FAQ.'
  }
}

onMounted(() => {
  fetchAllFaqs()
})

watch([() => filters.value.productId, () => filters.value.isDefault], () => {
  fetchAllFaqs()
})
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <TableCardToolbar
          v-model:search="filters.search"
          title="FAQ"
          search-placeholder="Question or Answer"
        >
          <template #filters>
            <VSelect
              v-model="filters.productId"
              :items="productOptions"
              label="Product"
              density="compact"
              hide-details
              style="min-width: 180px"
            />
            <VSelect
              v-model="filters.isDefault"
              :items="isDefaultOptions"
              label="Type"
              density="compact"
              hide-details
              style="min-width: 160px"
            />
          </template>

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
              Add Question
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
            v-if="isLoading && faqs.length === 0"
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
                  Question
                </th>
                <th class="text-uppercase">
                  Answer
                </th>
                <th class="text-uppercase">
                  Product
                </th>
                <th class="text-uppercase">
                  Display Order
                </th>
                <th class="text-uppercase text-end">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredFaqs.length === 0">
                <td
                  colspan="5"
                  class="text-center text-medium-emphasis py-6"
                >
                  {{ hasActiveFilters ? 'No questions found matching the applied filters.' : 'No questions to display.' }}
                </td>
              </tr>
              <tr
                v-for="faq in filteredFaqs"
                :key="faq.id"
              >
                <td>{{ faq.question || '—' }}</td>
                <td>{{ faq.answer ? (faq.answer.length > 60 ? `${faq.answer.slice(0, 60)}...` : faq.answer) : '—' }}</td>
                <td>
                  <VChip
                    v-if="faq.product_id"
                    size="small"
                    color="primary"
                    variant="tonal"
                    label
                  >
                    {{ faq.product_name || `#${faq.product_id}` }}
                  </VChip>
                  <span
                    v-else
                    class="text-medium-emphasis"
                  >Public</span>
                </td>
                <td>{{ faq.display_order }}</td>
                <td class="text-end">
                  <RowActionsMenu
                    :actions="rowActions"
                    @select="action => handleRowAction(faq, action)"
                  />
                </td>
              </tr>
            </tbody>
          </VTable>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <FaqDetailDialog
    v-model="detailDialogOpen"
    :faq-id="selectedFaq?.id ?? null"
    :products="products"
  />

  <FaqFormDialog
    v-model="formDialogOpen"
    :faq="selectedFaq"
    :products="products"
    @save="handleSave"
  />

  <DeleteConfirmDialog
    v-model="deleteDialogOpen"
    title="Delete FAQ"
    :message="`Are you sure you want to delete the question '${faqToDelete?.question || ''}'?`"
    confirm-text="Delete"
    :loading="isLoading"
    @confirm="confirmDelete"
  />
</template>

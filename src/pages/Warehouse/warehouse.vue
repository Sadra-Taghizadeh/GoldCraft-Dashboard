<script setup>
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog.vue'
import RowActionsMenu from '@/components/shared/RowActionsMenu.vue'
import TableCardToolbar from '@/components/shared/TableCardToolbar.vue'
import ProductDetailDialog from '@/pages/Products/components/ProductDetailDialog.vue'
import TransactionListDialog from '@/pages/Warehouse/components/TransactionListDialog.vue'
import VariantsListDialog from '@/pages/Warehouse/components/VariantsListDialog.vue'
import {
  deleteProduct,
  fetchProductCategories,
  fetchProducts,
} from '@/services/products'

const products = ref([])
const categories = ref([])
const counts = ref({ total_products: 0, central_variants: 0, active_variants: 0 })

const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const deleteDialogOpen = ref(false)
const selectedProduct = ref(null)
const detailDialogOpen = ref(false)
const variantsDialogOpen = ref(false)
const transactionDialogOpen = ref(false)
const previewOpen = ref(false)
const previewImageUrl = ref('')

const filters = ref({
  search: '',
  categoryId: '',
  active: 'all',
})

const rowActions = [
  { title: 'Details', value: 'detail', icon: 'bx-show' },
  { title: 'Transfer History', value: 'transactions', icon: 'bx-transfer' },
  { title: 'Delete', value: 'delete', icon: 'bx-trash' },
]

const categoryMap = computed(() => {
  const map = new Map()

  categories.value.forEach(category => map.set(category.id, category.name))

  return map
})

const categoryOptions = computed(() => ([
  { title: 'All Categories', value: '' },
  ...categories.value.map(category => ({
    title: category.name,
    value: category.id,
  })),
]))

const activeOptions = [
  { title: 'All', value: 'all' },
  { title: 'Active', value: 'true' },
  { title: 'Inactive', value: 'false' },
]

const normalizeText = value => `${value ?? ''}`.trim().toLowerCase()

const filteredProducts = computed(() => {
  const search = normalizeText(filters.value.search)
  const categoryId = `${filters.value.categoryId ?? ''}`.trim()
  const activeFilter = filters.value.active

  return products.value.filter((product) => {
    const productCategoryId = `${product.category?.id ?? product.category ?? ''}`

    const matchesSearch = !search
      || normalizeText(product.name).includes(search)
      || normalizeText(product.slug).includes(search)

    const matchesCategory = !categoryId || productCategoryId === categoryId

    const matchesActive = activeFilter === 'all'
      || Boolean(product.is_active) === (activeFilter === 'true')

    return matchesSearch && matchesCategory && matchesActive
  })
})

const totalProducts = computed(() => counts.value.total_products)
const activeProducts = computed(() => counts.value.active_variants)
const totalInventory = computed(() => counts.value.central_variants)

const hasActiveFilters = computed(() => Boolean(
  normalizeText(filters.value.search)
  || `${filters.value.categoryId ?? ''}`.trim()
  || filters.value.active !== 'all',
))

async function loadProducts() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const [productResponse, categoryResponse] = await Promise.all([
      fetchProducts(),
      fetchProductCategories(),
    ])

    if (productResponse?.counts) {
      counts.value = productResponse.counts
    }

    products.value = Array.isArray(productResponse)
      ? productResponse
      : Array.isArray(productResponse?.results)
        ? productResponse.results
        : []
    categories.value = Array.isArray(categoryResponse) ? categoryResponse : []
  }
  catch (error) {
    products.value = []
    categories.value = []
    errorMessage.value = error?.response?.data?.detail || 'Unable to load products.'
  }
  finally {
    isLoading.value = false
  }
}

function resetFilters() {
  filters.value.search = ''
  filters.value.categoryId = ''
  filters.value.active = 'all'
}

function handleRowAction(product, action) {
  if (action?.value === 'detail') {
    selectedProduct.value = product
    detailDialogOpen.value = true
  }
  else if (action?.value === 'transactions') {
    selectedProduct.value = product
    transactionDialogOpen.value = true
  }
  else if (action?.value === 'delete') {
    selectedProduct.value = product
    deleteDialogOpen.value = true
  }
}

function openVariantsDialog(product) {
  selectedProduct.value = product
  variantsDialogOpen.value = true
}

async function confirmDelete() {
  if (!selectedProduct.value?.slug)
    return

  try {
    await deleteProduct(selectedProduct.value.slug)
    successMessage.value = 'Product deleted successfully.'
    deleteDialogOpen.value = false
    selectedProduct.value = null
    await loadProducts()
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  }
  catch (error) {
    errorMessage.value = error?.response?.data?.detail || 'Unable to delete product.'
  }
}

onMounted(() => {
  loadProducts()
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
                icon="bx-cube"
                size="24"
              />
            </VAvatar>
            <div>
              <div class="text-caption text-medium-emphasis">
                Total Products
              </div>
              <div class="text-h5">
                {{ totalProducts.toLocaleString() }}
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
                Total Stock
              </div>
              <div class="text-h5">
                {{ activeProducts.toLocaleString() }}
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
              color="info"
              variant="tonal"
              size="48"
            >
              <VIcon
                icon="bx-package"
                size="24"
              />
            </VAvatar>
            <div>
              <div class="text-caption text-medium-emphasis">
                Central Warehouse Stock
              </div>
              <div class="text-h5">
                {{ totalInventory.toLocaleString() }}
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
          :title="`Warehouse (${totalProducts})`"
          search-placeholder="Product name, slug"
          search-label="Search"
        >
          <template #filters>
            <VSelect
              v-model="filters.categoryId"
              :items="categoryOptions"
              label="Category"
              density="compact"
              hide-details
              style="min-width: 180px"
            />
            <VSelect
              v-model="filters.active"
              :items="activeOptions"
              label="Status"
              density="compact"
              hide-details
              style="min-width: 140px"
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
              variant="text"
              icon="bx-refresh"
              @click="loadProducts"
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
            v-if="isLoading && filteredProducts.length === 0"
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
                  Image
                </th>
                <th class="text-uppercase text-center">
                  Name
                </th>
                <th class="text-uppercase text-center">
                  Category
                </th>
                <th class="text-uppercase text-center">
                  Active
                </th>
                <th class="text-uppercase text-center">
                  Stock
                </th>
                <th class="text-uppercase text-center">
                  Variants
                </th>
                <th class="text-uppercase text-end">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredProducts.length === 0">
                <td
                  colspan="7"
                  class="text-center text-medium-emphasis py-6"
                >
                  {{ hasActiveFilters ? 'No products found matching the applied filters.' : 'No products to display.' }}
                </td>
              </tr>
              <tr
                v-for="product in filteredProducts"
                :key="product.id"
              >
                <td class="pt-1 pb-1">
                  <div
                    class="product-thumb"
                    title="View image"
                    @click="previewImageUrl = product.primary_image; previewOpen = true"
                  >
                    <template v-if="product.primary_image">
                      <VImg
                        :src="product.primary_image"
                        class="product-thumb-img"
                        cover
                        eager
                      />
                      <div class="product-thumb-overlay">
                        <VIcon
                          icon="bx-search"
                          size="18"
                        />
                      </div>
                    </template>
                    <div
                      v-else
                      class="product-thumb-placeholder"
                    >
                      <VIcon
                        icon="bx-image"
                        size="22"
                        color="disabled"
                      />
                    </div>
                  </div>
                </td>
                <td class="text-center">
                  <div>{{ product.name || '—' }}</div>
                  <div class="text-caption text-medium-emphasis mt-1">
                    {{ product.slug || '—' }}
                  </div>
                </td>
                <td class="text-center">
                  {{ product.category?.name || categoryMap.get(product.category) || '—' }}
                </td>
                <td class="text-center">
                  <VChip
                    v-if="product.is_active"
                    size="small"
                    label
                    color="success"
                    variant="tonal"
                  >
                    Active
                  </VChip>
                  <VChip
                    v-else
                    size="small"
                    label
                    color="error"
                    variant="tonal"
                  >
                    Inactive
                  </VChip>
                </td>
                <td class="text-center">
                  {{ product.total_quantity ?? '—' }}
                </td>
                <td class="text-center">
                  <VBtn
                    size="small"
                    variant="tonal"
                    color="info"
                    prepend-icon="bx-package"
                    @click="openVariantsDialog(product)"
                  >
                    Variants
                    <VChip
                      size="x-small"
                      class="ms-2"
                      color="info"
                      variant="flat"
                    >
                      {{ product.total_quantity ?? 0 }}
                    </VChip>
                  </VBtn>
                </td>
                <td class="text-end">
                  <RowActionsMenu
                    :actions="rowActions"
                    @select="action => handleRowAction(product, action)"
                  />
                </td>
              </tr>
            </tbody>
          </VTable>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <DeleteConfirmDialog
    v-model="deleteDialogOpen"
    title="Delete Product"
    :message="`Are you sure you want to delete product &quot;${selectedProduct?.name || ''}&quot;?`"
    confirm-text="Delete Product"
    @confirm="confirmDelete"
  />

  <ProductDetailDialog
    v-model="detailDialogOpen"
    :slug="selectedProduct?.slug || ''"
  />

  <VariantsListDialog
    v-model="variantsDialogOpen"
    :slug="selectedProduct?.slug || ''"
  />

  <TransactionListDialog
    v-model="transactionDialogOpen"
    :product-name="selectedProduct?.name || ''"
  />

  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="previewOpen"
        class="image-viewer-overlay"
        @click.self="previewOpen = false"
      >
        <VBtn
          icon
          size="small"
          variant="text"
          color="white"
          class="image-viewer-close"
          @click="previewOpen = false"
        >
          <VIcon icon="bx-x" size="24" />
        </VBtn>

        <img
          v-if="previewImageUrl"
          :src="previewImageUrl"
          alt="Product image preview"
          class="image-viewer-img"
        >
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.product-thumb {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  isolation: isolate;
  transition:
    transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.25s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
  border: 2px solid rgba(var(--v-border-color), 0.1);
}

.product-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
}

.product-thumb-img {
  width: 100%;
  height: 100%;
}

.product-thumb-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  opacity: 0;
  transition: opacity 0.2s ease;
  backdrop-filter: blur(2px);
}

.product-thumb:hover .product-thumb-overlay {
  opacity: 1;
}

.product-thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-border-color), 0.04);
}
</style>

<style>
.image-viewer-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.image-viewer-img {
  max-width: 90vw;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 8px;
  user-select: none;
}

.image-viewer-close {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 10;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

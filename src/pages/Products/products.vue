<script setup>
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog.vue'
import RowActionsMenu from '@/components/shared/RowActionsMenu.vue'
import TableCardToolbar from '@/components/shared/TableCardToolbar.vue'
import ProductDetailDialog from '@/pages/Products/components/ProductDetailDialog.vue'
import ProductFaqDialog from '@/pages/Products/components/ProductFaqDialog.vue'
import ProductFormDialog from '@/pages/Products/components/ProductFormDialog.vue'
import {
  deleteProduct,
  fetchProductCategories,
  fetchProductDetail,
  fetchProducts,
} from '@/services/products'
import { convertDigits } from '@/utils/currency'

const products = ref([])
const categories = ref([])

const filters = ref({
  search: '',
  categoryId: '',
  active: 'all',
  featured: 'all',
})

const isLoading = ref(false)
const errorMessage = ref('')
const detailDialogOpen = ref(false)
const formDialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const productToDelete = ref(null)
const selectedProduct = ref(null)
const previewOpen = ref(false)
const previewImageUrl = ref('')
const faqDialogOpen = ref(false)

const rowActions = [
  { title: 'Details', value: 'detail', icon: 'bx-show' },
  { title: 'Edit', value: 'edit', icon: 'bx-edit' },
  { title: 'FAQs', value: 'faq', icon: 'bx-question-mark' },
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

const featuredOptions = [
  { title: 'All', value: 'all' },
  { title: 'Featured', value: 'true' },
  { title: 'Not Featured', value: 'false' },
]

const normalizeText = value => convertDigits(`${value ?? ''}`, 'en').trim().toLowerCase()

const filteredProducts = computed(() => {
  const search = normalizeText(filters.value.search)
  const categoryId = `${filters.value.categoryId ?? ''}`.trim()
  const activeFilter = filters.value.active
  const featuredFilter = filters.value.featured

  return products.value.filter((product) => {
    const productCategoryId = `${product.category?.id ?? product.category ?? ''}`

    const matchesSearch = !search
      || normalizeText(product.name).includes(search)
      || normalizeText(product.slug).includes(search)

    const matchesCategory = !categoryId || productCategoryId === categoryId

    const matchesActive = activeFilter === 'all'
      || Boolean(product.is_active) === (activeFilter === 'true')

    const matchesFeatured = featuredFilter === 'all'
      || Boolean(product.is_featured) === (featuredFilter === 'true')

    return matchesSearch && matchesCategory && matchesActive && matchesFeatured
  })
})

const hasActiveFilters = computed(() => Boolean(
  normalizeText(filters.value.search)
  || `${filters.value.categoryId ?? ''}`.trim()
  || filters.value.active !== 'all'
  || filters.value.featured !== 'all',
))

const formatBoolean = value => (value ? 'Yes' : 'No')

async function fetchPageData() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const [productResponse, categoryResponse] = await Promise.all([
      fetchProducts(),
      fetchProductCategories(),
    ])

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

function openCreateDialog() {
  selectedProduct.value = null
  formDialogOpen.value = true
}

function resetFilters() {
  filters.value.search = ''
  filters.value.categoryId = ''
  filters.value.active = 'all'
  filters.value.featured = 'all'
}

async function openEditDialog(product) {
  formDialogOpen.value = true
  selectedProduct.value = product

  try {
    if (product?.slug) {
      selectedProduct.value = await fetchProductDetail(product.slug)
    }
  }
  catch (error) {
    errorMessage.value = error?.response?.data?.detail || 'Unable to load product details for editing.'
  }
}

function openDetailDialog(product) {
  selectedProduct.value = product
  detailDialogOpen.value = true
}

function handleRowAction(product, action) {
  if (action?.value === 'detail')
    return openDetailDialog(product)
  if (action?.value === 'edit')
    return openEditDialog(product)
  if (action?.value === 'faq') {
    selectedProduct.value = product
    faqDialogOpen.value = true

    return
  }
  if (action?.value === 'delete')
    return handleDelete(product)
}

async function handleDelete(product) {
  productToDelete.value = product
  deleteDialogOpen.value = true
}

async function confirmDelete() {
  if (!productToDelete.value?.slug)
    return

  try {
    await deleteProduct(productToDelete.value.slug)
    await fetchPageData()
    deleteDialogOpen.value = false
    productToDelete.value = null
  }
  catch (error) {
    errorMessage.value = error?.response?.data?.detail || 'Unable to delete product.'
  }
}

async function handleSave() {
  selectedProduct.value = null
  await fetchPageData()
}

onMounted(() => {
  fetchPageData()
})
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <TableCardToolbar
          v-model:search="filters.search"
          title="Products"
          search-placeholder="Name or slug"
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
            <VSelect
              v-model="filters.featured"
              :items="featuredOptions"
              label="Featured"
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
              color="primary"
              @click="openCreateDialog"
            >
              Add Product
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
            v-if="isLoading && products.length === 0"
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
                <th class="text-uppercase">
                  Name
                </th>
                <th class="text-uppercase">
                  Category
                </th>
                <th class="text-uppercase">
                  Active
                </th>
                <th class="text-uppercase">
                  Featured
                </th>
                <th class="text-uppercase">
                  Stock
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
                  {{ hasActiveFilters ? 'No products found with the applied filters.' : 'No products to display.' }}
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
                        alt=""
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
                <td>
                  <div>{{ product.name || '—' }}</div>
                  <div class="text-caption text-medium-emphasis mt-1">
                    Slug: {{ product.slug || '—' }}
                  </div>
                </td>
                <td>{{ product.category?.name || categoryMap.get(product.category) || '—' }}</td>
                <td>{{ formatBoolean(product.is_active) }}</td>
                <td>{{ formatBoolean(product.is_featured) }}</td>
                <td>{{ product.total_quantity ?? '—' }}</td>
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

  <ProductDetailDialog
    v-model="detailDialogOpen"
    :slug="selectedProduct?.slug || ''"
  />

  <ProductFormDialog
    v-model="formDialogOpen"
    :product="selectedProduct"
    :categories="categories"
    @save="handleSave"
  />

  <ProductFaqDialog
    v-model="faqDialogOpen"
    :product="selectedProduct"
  />

  <DeleteConfirmDialog
    v-model="deleteDialogOpen"
    title="Delete product"
    :message="`Are you sure you want to delete the product \u00AB${productToDelete?.name || ''}\u00BB?`"
    confirm-text="Delete product"
    :loading="isLoading"
    @confirm="confirmDelete"
  />
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

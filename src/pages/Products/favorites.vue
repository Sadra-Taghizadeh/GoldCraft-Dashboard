<script setup>
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog.vue'
import RowActionsMenu from '@/components/shared/RowActionsMenu.vue'
import TableCardToolbar from '@/components/shared/TableCardToolbar.vue'
import ProductDetailDialog from '@/pages/Products/components/ProductDetailDialog.vue'
import ProductFaqDialog from '@/pages/Products/components/ProductFaqDialog.vue'
import ProductFormDialog from '@/pages/Products/components/ProductFormDialog.vue'
import {
  deleteProduct,
  fetchFavoriteProducts,
  fetchProductCategories,
  fetchProductDetail,
} from '@/services/products'
import { convertDigits } from '@/utils/currency'

const products = ref([])
const categories = ref([])

const filters = ref({
  search: '',
})

const isLoading = ref(false)
const errorMessage = ref('')
const detailDialogOpen = ref(false)
const formDialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const productToDelete = ref(null)
const selectedProduct = ref(null)
const previewDialogOpen = ref(false)
const previewImageUrl = ref('')
const previewLoading = ref(false)
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

const normalizeText = value => convertDigits(`${value ?? ''}`, 'en').trim().toLowerCase()

const filteredProducts = computed(() => {
  const search = normalizeText(filters.value.search)

  return products.value.filter((product) => {
    const matchesSearch = !search
      || normalizeText(product.name).includes(search)
      || normalizeText(product.slug).includes(search)

    return matchesSearch
  })
})

async function fetchPageData() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const [productResponse, categoryResponse] = await Promise.all([
      fetchFavoriteProducts(),
      fetchProductCategories(),
    ])

    products.value = Array.isArray(productResponse) ? productResponse : []
    categories.value = Array.isArray(categoryResponse) ? categoryResponse : []
  }
  catch (error) {
    products.value = []
    categories.value = []
    errorMessage.value = error?.response?.data?.detail || 'Unable to load favorite products.'
  }
  finally {
    isLoading.value = false
  }
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

function handleDelete(product) {
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
          title="Favorite Products"
          search-placeholder="Name or slug"
        />

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
                  Stock
                </th>
                <th class="text-uppercase">
                  Default Commission
                </th>
                <th class="text-uppercase text-end">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredProducts.length === 0">
                <td
                  colspan="6"
                  class="text-center text-medium-emphasis py-6"
                >
                  No favorite products to display.
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
                    @click="previewImageUrl = product.primary_image; previewLoading = true; previewDialogOpen = true"
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
                <td>{{ product.total_quantity ?? '—' }}</td>
                <td>{{ product.default_fee ?? '—' }}</td>
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

  <VDialog
    v-model="previewDialogOpen"
    max-width="900"
    content-class="preview-dialog"
    transition="dialog-bottom-transition"
    @click:outside="previewDialogOpen = false"
  >
    <VCard class="preview-card">
      <VBtn
        class="preview-close-btn"
        icon="bx-x"
        variant="text"
        size="x-small"
        @click="previewDialogOpen = false"
      />
      <div class="preview-img-wrapper">
        <VProgressCircular
          v-if="previewLoading"
          indeterminate
          color="primary"
          size="40"
          width="4"
          class="preview-loader"
        />
        <img
          :key="previewImageUrl"
          :src="previewImageUrl"
          alt="Product image preview"
          class="preview-img"
          :class="{ 'preview-img--loaded': !previewLoading }"
          @load="previewLoading = false"
          @error="previewLoading = false"
        >
      </div>
    </VCard>
  </VDialog>

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

:deep(.preview-card) {
  background: transparent !important;
  box-shadow: none !important;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}

:deep(.preview-dialog) {
  box-shadow: none;
}

:deep(.v-overlay__content) {
  top: 0 !important;
}

.preview-img-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  max-height: 85vh;
  max-width: 100%;
}

.preview-img {
  max-height: 85vh;
  max-width: 100%;
  object-fit: contain;
  border-radius: 12px;
  opacity: 0;
  transition: opacity 0.35s ease;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.3);
}

.preview-img--loaded {
  opacity: 1;
}

.preview-loader {
  position: absolute;
  z-index: 1;
}

.preview-close-btn {
  position: absolute !important;
  top: -44px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  background: rgba(255, 255, 255, 0.12) !important;
  backdrop-filter: blur(8px);
  border-radius: 50%;
  transition:
    background 0.2s ease,
    transform 0.2s ease !important;
}

.preview-close-btn:hover {
  background: rgba(255, 255, 255, 0.25) !important;
  transform: translateX(-50%) scale(1.1);
}
</style>

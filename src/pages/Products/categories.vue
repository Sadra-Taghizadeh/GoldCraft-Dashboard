<script setup>
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog.vue'
import RowActionsMenu from '@/components/shared/RowActionsMenu.vue'
import TableCardToolbar from '@/components/shared/TableCardToolbar.vue'
import ProductCategoryDetailDialog from '@/pages/Products/components/ProductCategoryDetailDialog.vue'
import ProductCategoryFormDialog from '@/pages/Products/components/ProductCategoryFormDialog.vue'
import {
  createProductCategory,
  deleteProductCategory,
  fetchProductCategories,
  updateProductCategory,
} from '@/services/products'
import { convertDigits } from '@/utils/currency'

const categories = ref([])

const filters = ref({
  search: '',
})

const isLoading = ref(false)
const errorMessage = ref('')
const detailDialogOpen = ref(false)
const formDialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const categoryToDelete = ref(null)
const selectedCategory = ref(null)

const previewOpen = ref(false)
const previewImageUrl = ref('')

const statusLabels = {
  true: 'Active',
  false: 'Inactive',
}

const rowActions = [
  { title: 'Details', value: 'detail', icon: 'bx-show' },
  { title: 'Edit', value: 'edit', icon: 'bx-edit' },
  { title: 'Delete', value: 'delete', icon: 'bx-trash' },
]

const normalizeText = value => convertDigits(`${value ?? ''}`, 'en').trim().toLowerCase()

const filteredCategories = computed(() => {
  const search = normalizeText(filters.value.search)

  if (!search)
    return categories.value

  return categories.value.filter(category => [category.name, category.slug].some(value => normalizeText(value).includes(search)))
})

const hasActiveFilters = computed(() => Boolean(normalizeText(filters.value.search)))

const formatDate = value => value || '—'

async function fetchCategories() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await fetchProductCategories()

    categories.value = Array.isArray(response) ? response : []
  }
  catch (error) {
    categories.value = []
    errorMessage.value = error?.response?.data?.detail || 'Unable to load categories.'
  }
  finally {
    isLoading.value = false
  }
}

function resetFilters() {
  filters.value.search = ''
}

function openCreateDialog() {
  selectedCategory.value = null
  formDialogOpen.value = true
}

function openEditDialog(category) {
  selectedCategory.value = category
  formDialogOpen.value = true
}

function openDetailDialog(category) {
  selectedCategory.value = category
  detailDialogOpen.value = true
}

function handleRowAction(category, action) {
  if (action?.value === 'detail')
    return openDetailDialog(category)
  if (action?.value === 'edit')
    return openEditDialog(category)
  if (action?.value === 'delete')
    return handleDelete(category)
}

async function handleDelete(category) {
  categoryToDelete.value = category
  deleteDialogOpen.value = true
}

async function confirmDelete() {
  if (!categoryToDelete.value?.slug)
    return

  try {
    await deleteProductCategory(categoryToDelete.value.slug)
    await fetchCategories()
    deleteDialogOpen.value = false
    categoryToDelete.value = null
  }
  catch (error) {
    errorMessage.value = error?.response?.data?.detail || 'Unable to delete category.'
  }
}

async function handleSave(payload) {
  try {
    const data = new FormData()

    data.append('name', payload.name)
    data.append('slug', payload.slug)
    data.append('description', payload.description || '')
    data.append('is_active', payload.is_active ? 'true' : 'false')
    data.append('display_order', String(payload.display_order))
    if (payload.imageFile instanceof File) {
      data.append('image', payload.imageFile)
    }

    if (selectedCategory.value?.slug) {
      await updateProductCategory(selectedCategory.value.slug, data)
    }
    else {
      await createProductCategory(data)
    }

    formDialogOpen.value = false
    selectedCategory.value = null
    await fetchCategories()
  }
  catch (error) {
    errorMessage.value = error?.response?.data?.detail || 'Unable to save category.'
  }
}

onMounted(() => {
  fetchCategories()
})
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <TableCardToolbar
          v-model:search="filters.search"
          title="Product Categories"
          search-placeholder="Name or slug"
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
              Add Category
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
            v-if="isLoading && filteredCategories.length === 0"
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
                  Slug
                </th>
                <th class="text-uppercase">
                  Status
                </th>
                <th class="text-uppercase">
                  Display Order
                </th>
                <th class="text-uppercase">
                  Created Date
                </th>
                <th class="text-uppercase text-end">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredCategories.length === 0">
                <td
                  colspan="7"
                  class="text-center text-medium-emphasis py-6"
                >
                  {{ hasActiveFilters ? 'No categories match the applied filters.' : 'No categories to display.' }}
                </td>
              </tr>
              <tr
                v-for="category in filteredCategories"
                :key="category.id"
              >
                <td class="pt-1 pb-1">
                  <div
                    class="product-thumb"
                    title="View Image"
                    @click="previewImageUrl = category.image; previewOpen = true"
                  >
                    <template v-if="category.image">
                      <VImg
                        :src="category.image"
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
                <td>{{ category.name || '—' }}</td>
                <td>{{ category.slug || '—' }}</td>
                <td>
                  <VChip
                    size="small"
                    label
                    :color="category.is_active ? 'success' : 'secondary'"
                  >
                    {{ statusLabels[category.is_active] }}
                  </VChip>
                </td>
                <td>{{ category.display_order ?? '—' }}</td>
                <td>{{ formatDate(category.created_at) }}</td>
                <td class="text-end">
                  <RowActionsMenu
                    :actions="rowActions"
                    @select="action => handleRowAction(category, action)"
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
          alt="Category image preview"
          class="image-viewer-img"
        >
      </div>
    </Transition>
  </Teleport>

  <ProductCategoryDetailDialog
    v-model="detailDialogOpen"
    :slug="selectedCategory?.slug || ''"
  />

  <ProductCategoryFormDialog
    v-model="formDialogOpen"
    :category="selectedCategory"
    @save="handleSave"
  />

  <DeleteConfirmDialog
    v-model="deleteDialogOpen"
    title="Delete Category"
    :message="`Are you sure you want to delete the category '${categoryToDelete?.name || ''}'?`"
    confirm-text="Delete Category"
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

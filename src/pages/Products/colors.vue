<script setup>
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog.vue'
import RowActionsMenu from '@/components/shared/RowActionsMenu.vue'
import TableCardToolbar from '@/components/shared/TableCardToolbar.vue'
import ProductColorFormDialog from '@/pages/Products/components/ProductColorFormDialog.vue'
import {
  createProductColor,
  deleteProductColor,
  fetchProductColorDetail,
  fetchProductColors,
  updateProductColor,
} from '@/services/products'
import { convertDigits } from '@/utils/currency'

const colors = ref([])

const filters = ref({
  search: '',
})

const isLoading = ref(false)
const errorMessage = ref('')
const formDialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const colorToDelete = ref(null)
const selectedColor = ref(null)

const rowActions = [
  { title: 'Edit', value: 'edit', icon: 'bx-edit' },
  { title: 'Delete', value: 'delete', icon: 'bx-trash' },
]

const normalizeText = value => convertDigits(`${value ?? ''}`, 'en').trim().toLowerCase()

const filteredColors = computed(() => {
  const search = normalizeText(filters.value.search)

  if (!search)
    return colors.value

  return colors.value.filter(color => [color.name, color.code].some(value => normalizeText(value).includes(search)))
})

const hasActiveFilters = computed(() => Boolean(normalizeText(filters.value.search)))

async function fetchColors() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await fetchProductColors()

    colors.value = Array.isArray(response) ? response : []
  }
  catch (error) {
    colors.value = []
    errorMessage.value = error?.response?.data?.detail || 'Unable to load product colors.'
  }
  finally {
    isLoading.value = false
  }
}

function resetFilters() {
  filters.value.search = ''
}

function openCreateDialog() {
  selectedColor.value = null
  formDialogOpen.value = true
}

async function openEditDialog(color) {
  formDialogOpen.value = true
  selectedColor.value = color

  try {
    if (color?.id) {
      selectedColor.value = await fetchProductColorDetail(color.id)
    }
  }
  catch (error) {
    errorMessage.value = error?.response?.data?.detail || 'Unable to load color details for editing.'
  }
}

function handleRowAction(color, action) {
  if (action?.value === 'edit')
    return openEditDialog(color)
  if (action?.value === 'delete')
    return handleDelete(color)
}

async function handleDelete(color) {
  colorToDelete.value = color
  deleteDialogOpen.value = true
}

async function confirmDelete() {
  if (!colorToDelete.value?.id)
    return

  try {
    await deleteProductColor(colorToDelete.value.id)
    await fetchColors()
    deleteDialogOpen.value = false
    colorToDelete.value = null
  }
  catch (error) {
    errorMessage.value = error?.response?.data?.detail || 'Unable to delete color.'
  }
}

async function handleSave(payload) {
  try {
    if (selectedColor.value?.id) {
      await updateProductColor(selectedColor.value.id, payload)
    }
    else {
      await createProductColor(payload)
    }

    formDialogOpen.value = false
    selectedColor.value = null
    await fetchColors()
  }
  catch (error) {
    errorMessage.value = error?.response?.data?.detail || 'Unable to save color.'
  }
}

const resolveColorText = color => color?.code || '—'

onMounted(() => {
  fetchColors()
})
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <TableCardToolbar
          v-model:search="filters.search"
          title="Product Colors"
          search-placeholder="Name or color code"
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
              Add Color
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
            v-if="isLoading && colors.length === 0"
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
                  Preview
                </th>
                <th class="text-uppercase text-end">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredColors.length === 0">
                <td
                  colspan="4"
                  class="text-center text-medium-emphasis py-6"
                >
                  {{ hasActiveFilters ? 'No colors match the applied filters.' : 'No colors to display.' }}
                </td>
              </tr>
              <tr
                v-for="color in filteredColors"
                :key="color.id"
              >
                <td>{{ color.name || '—' }}</td>
                <td>{{ resolveColorText(color) }}</td>
                <td>
                  <div class="d-flex align-center gap-3">
                    <div
                      class="color-swatch"
                      :style="{ backgroundColor: color.code || '#d9d9d9' }"
                    />
                    <span class="text-body-2 text-medium-emphasis">
                      {{ color.code || '—' }}
                    </span>
                  </div>
                </td>
                <td class="text-end">
                  <RowActionsMenu
                    :actions="rowActions"
                    @select="action => handleRowAction(color, action)"
                  />
                </td>
              </tr>
            </tbody>
          </VTable>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <ProductColorFormDialog
    v-model="formDialogOpen"
    :color="selectedColor"
    @save="handleSave"
  />

  <DeleteConfirmDialog
    v-model="deleteDialogOpen"
    title="Delete Color"
    :message="`Are you sure you want to delete the color '${colorToDelete?.name || ''}'?`"
    confirm-text="Delete Color"
    :loading="isLoading"
    @confirm="confirmDelete"
  />
</template>

<style scoped>
.color-swatch {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>

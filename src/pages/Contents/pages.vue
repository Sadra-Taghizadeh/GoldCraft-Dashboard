<script setup>
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog.vue'
import RowActionsMenu from '@/components/shared/RowActionsMenu.vue'
import TableCardToolbar from '@/components/shared/TableCardToolbar.vue'
import ContentPageDetailDialog from '@/pages/Contents/components/ContentPageDetailDialog.vue'
import ContentPageFormDialog from '@/pages/Contents/components/ContentPageFormDialog.vue'
import {
  createContentPage,
  deleteContentPage,
  fetchContentPages,
  updateContentPage,
} from '@/services/contents'
import { convertDigits } from '@/utils/currency'

const pages = ref([])

const filters = ref({
  search: '',
})

const isLoading = ref(false)
const errorMessage = ref('')
const detailDialogOpen = ref(false)
const formDialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const pageToDelete = ref(null)
const selectedPage = ref(null)

const statusLabels = {
  true: 'Published',
  false: 'Draft',
}

const rowActions = [
  { title: 'Details', value: 'detail', icon: 'bx-show' },
  { title: 'Edit', value: 'edit', icon: 'bx-edit' },
  { title: 'Delete', value: 'delete', icon: 'bx-trash' },
]

const normalizeText = value => convertDigits(`${value ?? ''}`, 'en').trim().toLowerCase()

const filteredPages = computed(() => {
  const search = normalizeText(filters.value.search)

  if (!search)
    return pages.value

  return pages.value.filter(page => [page.title, page.slug].some(value => normalizeText(value).includes(search)))
})

const hasActiveFilters = computed(() => Boolean(normalizeText(filters.value.search)))

const formatDate = value => value || '—'

async function fetchPages() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await fetchContentPages()

    pages.value = Array.isArray(response) ? response : []
  }
  catch (error) {
    pages.value = []
    errorMessage.value = error?.response?.data?.detail || 'Unable to load pages.'
  }
  finally {
    isLoading.value = false
  }
}

function resetFilters() {
  filters.value.search = ''
}

function openCreateDialog() {
  selectedPage.value = null
  formDialogOpen.value = true
}

function openEditDialog(page) {
  selectedPage.value = page
  formDialogOpen.value = true
}

function openDetailDialog(page) {
  selectedPage.value = page
  detailDialogOpen.value = true
}

function handleRowAction(page, action) {
  if (action?.value === 'detail')
    return openDetailDialog(page)
  if (action?.value === 'edit')
    return openEditDialog(page)
  if (action?.value === 'delete')
    return handleDelete(page)
}

async function handleDelete(page) {
  pageToDelete.value = page
  deleteDialogOpen.value = true
}

async function confirmDelete() {
  if (!pageToDelete.value?.slug)
    return

  try {
    await deleteContentPage(pageToDelete.value.slug)
    await fetchPages()
    deleteDialogOpen.value = false
    pageToDelete.value = null
  }
  catch (error) {
    errorMessage.value = error?.response?.data?.detail || 'Unable to delete page.'
  }
}

async function handleSave(payload) {
  try {
    if (selectedPage.value?.slug) {
      await updateContentPage(selectedPage.value.slug, payload)
    }
    else {
      await createContentPage(payload)
    }

    formDialogOpen.value = false
    selectedPage.value = null
    await fetchPages()
  }
  catch (error) {
    errorMessage.value = error?.response?.data?.detail || 'Unable to save page.'
  }
}

onMounted(() => {
  fetchPages()
})
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <TableCardToolbar
          v-model:search="filters.search"
          title="Content Pages"
          search-placeholder="Title or Slug"
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
              Add Page
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
            v-if="isLoading && pages.length === 0"
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
                  Title
                </th>
                <th class="text-uppercase">
                  Slug
                </th>
                <th class="text-uppercase">
                  Status
                </th>
                <th class="text-uppercase">
                  Created Date
                </th>
                <th class="text-uppercase">
                  Last Updated
                </th>
                <th class="text-uppercase text-end">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredPages.length === 0">
                <td
                  colspan="6"
                  class="text-center text-medium-emphasis py-6"
                >
                  {{ hasActiveFilters ? 'No pages found matching the applied filters.' : 'No pages to display.' }}
                </td>
              </tr>
              <tr
                v-for="page in filteredPages"
                :key="page.id"
              >
                <td>{{ page.title || '—' }}</td>
                <td>{{ page.slug || '—' }}</td>
                <td>
                  <VChip
                    size="small"
                    label
                    :color="page.is_published ? 'success' : 'secondary'"
                  >
                    {{ statusLabels[page.is_published] }}
                  </VChip>
                </td>
                <td>{{ formatDate(page.created_at) }}</td>
                <td>{{ formatDate(page.updated_at) }}</td>
                <td class="text-end">
                  <RowActionsMenu
                    :actions="rowActions"
                    @select="action => handleRowAction(page, action)"
                  />
                </td>
              </tr>
            </tbody>
          </VTable>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <ContentPageDetailDialog
    v-model="detailDialogOpen"
    :slug="selectedPage?.slug || ''"
  />

  <ContentPageFormDialog
    v-model="formDialogOpen"
    :page="selectedPage"
    @save="handleSave"
  />

  <DeleteConfirmDialog
    v-model="deleteDialogOpen"
    title="Delete Page"
    :message="`Are you sure you want to delete the page '${pageToDelete?.title || ''}'?`"
    confirm-text="Delete Page"
    :loading="isLoading"
    @confirm="confirmDelete"
  />
</template>

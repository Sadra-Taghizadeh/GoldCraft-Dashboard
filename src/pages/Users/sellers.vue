<script setup>
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog.vue'
import RowActionsMenu from '@/components/shared/RowActionsMenu.vue'
import TableCardToolbar from '@/components/shared/TableCardToolbar.vue'
import SellerFormDialog from '@/pages/Users/components/SellerFormDialog.vue'
import { createSeller, deleteSeller, fetchSellers, updateSeller } from '@/services/sellers'

const sellers = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const formDialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const selectedSeller = ref(null)

const filters = ref({
  search: '',
})

function getRowActions() {
  return [
    {
      title: 'Edit',
      value: 'edit',
      icon: 'bx-edit',
    },
    {
      title: 'Delete',
      value: 'delete',
      icon: 'bx-trash',
    },
  ]
}

const normalizeText = value => `${value ?? ''}`.trim().toLowerCase()

const filteredSellers = computed(() => {
  const search = normalizeText(filters.value.search)

  return sellers.value.filter((seller) => {
    if (!search)
      return true

    return [seller.person_name, seller.phone_number, seller.user_email, seller.user_phone]
      .some(value => normalizeText(value).includes(search))
  })
})

const totalSellers = computed(() => sellers.value.length)

async function loadSellers() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await fetchSellers()

    sellers.value = Array.isArray(response.results) ? response.results : Array.isArray(response) ? response : []
  }
  catch (error) {
    sellers.value = []
    errorMessage.value = error?.response?.data?.detail || 'Unable to load sellers.'
  }
  finally {
    isLoading.value = false
  }
}

function openCreateDialog() {
  selectedSeller.value = null
  formDialogOpen.value = true
}

function openEditDialog(seller) {
  selectedSeller.value = seller
  formDialogOpen.value = true
}

function openDeleteDialog(seller) {
  selectedSeller.value = seller
  deleteDialogOpen.value = true
}

function handleRowAction(seller, action) {
  if (action?.value === 'edit') {
    openEditDialog(seller)
  }
  else if (action?.value === 'delete') {
    openDeleteDialog(seller)
  }
}

async function handleSave(data) {
  try {
    if (selectedSeller.value) {
      await updateSeller(selectedSeller.value.id, data)
      successMessage.value = 'Seller updated successfully.'
    }
    else {
      await createSeller(data)
      successMessage.value = 'Seller added successfully.'
    }
    await loadSellers()
    setTimeout(() => { successMessage.value = '' }, 3000)
  }
  catch (error) {
    errorMessage.value = error?.response?.data?.detail || 'Unable to save seller.'
  }
}

async function handleDelete() {
  if (!selectedSeller.value)
    return

  try {
    await deleteSeller(selectedSeller.value.id)
    successMessage.value = 'Seller deleted successfully.'
    deleteDialogOpen.value = false
    selectedSeller.value = null
    await loadSellers()
    setTimeout(() => { successMessage.value = '' }, 3000)
  }
  catch (error) {
    errorMessage.value = error?.response?.data?.detail || 'Unable to delete seller.'
  }
}

onMounted(() => {
  loadSellers()
})
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <TableCardToolbar
          v-model:search="filters.search"
          :title="`Sellers (${totalSellers})`"
          search-placeholder="Name, phone, email"
          search-label="Search"
        >
          <template #actions>
            <VBtn
              color="primary"
              variant="flat"
              @click="openCreateDialog"
            >
              <VIcon
                start
                icon="bx-plus"
              />
              Add Seller
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
            v-if="isLoading && filteredSellers.length === 0"
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
                  Person Name
                </th>
                <th class="text-uppercase text-center">
                  Seller Phone
                </th>
                <th class="text-uppercase text-center">
                  User Email
                </th>
                <th class="text-uppercase text-center">
                  User Phone
                </th>
                <th class="text-uppercase text-center">
                  Status
                </th>
                <th class="text-uppercase text-end">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredSellers.length === 0">
                <td
                  colspan="6"
                  class="text-center text-medium-emphasis py-6"
                >
                  No sellers found.
                </td>
              </tr>
              <tr
                v-for="seller in filteredSellers"
                :key="seller.id"
              >
                <td>
                  <div class="d-flex align-center gap-3">
                    <VAvatar
                      size="32"
                      color="primary"
                      variant="tonal"
                    >
                      <span class="text-caption">
                        {{ seller.person_name?.charAt(0) || '?' }}
                      </span>
                    </VAvatar>
                    <span>{{ seller.person_name || '—' }}</span>
                  </div>
                </td>
                <td dir="ltr" class="text-center">
                  {{ seller.phone_number || '—' }}
                </td>
                <td class="text-center">
                  {{ seller.user_email || '—' }}
                </td>
                <td dir="ltr" class="text-center">
                  {{ seller.user_phone || '—' }}
                </td>
                <td key="status" class="text-center">
                  <VChip
                    v-if="seller.is_active"
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
                <td class="text-end">
                  <RowActionsMenu
                    :actions="getRowActions()"
                    @select="action => handleRowAction(seller, action)"
                  />
                </td>
              </tr>
            </tbody>
          </VTable>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <SellerFormDialog
    v-model="formDialogOpen"
    :seller="selectedSeller"
    @save="handleSave"
  />

  <DeleteConfirmDialog
    v-model="deleteDialogOpen"
    @confirm="handleDelete"
  />
</template>

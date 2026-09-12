<script setup>
import { formatPhoneNumber } from '@/@core/utils/formatters'
import RowActionsMenu from '@/components/shared/RowActionsMenu.vue'
import TableCardToolbar from '@/components/shared/TableCardToolbar.vue'
import UserProfileDialog from '@/pages/Users/components/UserProfileDialog.vue'
import { fetchUsers, verifyUser } from '@/services/users'
import { convertDigits } from '@/utils/currency'

const MEDIA_BASE_URL = 'http://belluccidesign.gold'

const users = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const profileDialogOpen = ref(false)
const selectedUserId = ref(null)

const filters = ref({
  search: '',
})

const updatingUserId = ref(null)

function getRowActions(user) {
  return [
    {
      title: 'Profile',
      value: 'profile',
      icon: 'bx-user',
    },
    {
      title: user.is_verified ? 'Unverify' : 'Verify',
      value: 'verify',
      icon: user.is_verified ? 'bx-shield-x' : 'bx-check-shield',
    },
  ]
}

const normalizeText = value => convertDigits(`${value ?? ''}`, 'en').trim().toLowerCase()

function fullProfilePicture(url) {
  if (!url)
    return ''

  return url.startsWith('http') ? url : `${MEDIA_BASE_URL}${url}`
}

const filteredUsers = computed(() => {
  const search = normalizeText(filters.value.search)

  return users.value.filter((user) => {
    if (!search)
      return true

    return [user.person_name, user.email, user.phone_number, user.company_name, user.city, user.country]
      .some(value => normalizeText(value).includes(search))
  })
})

const totalUsers = computed(() => users.value.length)

async function loadUsers() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await fetchUsers()

    users.value = Array.isArray(response.results) ? response.results : Array.isArray(response) ? response : []
  }
  catch (error) {
    users.value = []
    errorMessage.value = error?.response?.data?.detail || 'Unable to load users.'
  }
  finally {
    isLoading.value = false
  }
}

function openProfile(userId) {
  selectedUserId.value = userId
  profileDialogOpen.value = true
}

async function handleVerify(user) {
  updatingUserId.value = user.id
  try {
    await verifyUser(user.id, !user.is_verified)
    await loadUsers()
  }
  catch (error) {
    errorMessage.value = error?.response?.data?.detail || 'Unable to change verification status.'
  }
  finally {
    updatingUserId.value = null
  }
}

function handleRowAction(user, action) {
  if (action?.value === 'profile') {
    openProfile(user.id)
  }
  else if (action?.value === 'verify') {
    handleVerify(user)
  }
}

async function handleQuickVerify(user) {
  await handleVerify(user)
}

async function handleProfileUpdated() {
  await loadUsers()
}

onMounted(() => {
  loadUsers()
})
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <TableCardToolbar
          v-model:search="filters.search"
          :title="`Users (${totalUsers})`"
          search-placeholder="Name, email, phone, company, city"
          search-label="Search"
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
            v-if="isLoading && filteredUsers.length === 0"
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
                  Email
                </th>
                <th class="text-uppercase">
                  Phone
                </th>
                <th class="text-uppercase">
                  Company
                </th>
                <th class="text-uppercase">
                  City
                </th>
                <th class="text-uppercase">
                  Role
                </th>
                <th class="text-uppercase">
                  Verified
                </th>
                <th class="text-uppercase">
                  Status
                </th>
                <th class="text-uppercase text-end">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredUsers.length === 0">
                <td
                  colspan="9"
                  class="text-center text-medium-emphasis py-6"
                >
                  No users found.
                </td>
              </tr>
              <tr
                v-for="user in filteredUsers"
                :key="user.id"
              >
                <td>
                  <div class="d-flex align-center gap-3">
                    <VAvatar
                      size="32"
                      color="primary"
                      variant="tonal"
                    >
                      <VImg
                        v-if="user.profile_picture"
                        :src="fullProfilePicture(user.profile_picture)"
                        cover
                      />
                      <span
                        v-else
                        class="text-caption"
                      >
                        {{ user.person_name?.charAt(0) || '?' }}
                      </span>
                    </VAvatar>
                    <span>{{ user.person_name || '—' }}</span>
                  </div>
                </td>
                <td>
                  {{ user.email || '—' }}
                </td>
                <td>
                  {{ formatPhoneNumber(user.phone_number) || '—' }}
                </td>
                <td>
                  {{ user.company_name || '—' }}
                </td>
                <td>
                  {{ user.city || '—' }}
                </td>
                <td>
                  <VChip
                    size="small"
                    label
                    :color="user.role === 'admin' ? 'error' : user.role === 'staff' ? 'warning' : 'info'"
                  >
                    {{ user.role === 'admin' ? 'Admin' : user.role === 'staff' ? 'Staff' : 'Customer' }}
                  </VChip>
                </td>
                <td>
                  <div class="d-flex gap-2 align-center">
                    <VSwitch
                      :model-value="user.is_verified"
                      :loading="updatingUserId === user.id"
                      :disabled="updatingUserId === user.id"
                      color="success"
                      density="compact"
                      hide-details
                      @update:model-value="handleQuickVerify(user)"
                    />
                    <span class="text-caption text-medium-emphasis">
                      {{ user.is_verified ? 'Verified' : 'Not Verified' }}
                    </span>
                  </div>
                </td>
                <td>
                  <VChip
                    v-if="user.is_active"
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
                    :actions="getRowActions(user)"
                    @select="action => handleRowAction(user, action)"
                  />
                </td>
              </tr>
            </tbody>
          </VTable>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <UserProfileDialog
    v-model="profileDialogOpen"
    :user-id="selectedUserId"
    @updated="handleProfileUpdated"
  />
</template>

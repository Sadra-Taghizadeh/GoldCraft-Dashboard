<script setup>
import { formatPhoneNumber } from '@/@core/utils/formatters'
import { fetchUserProfile, updateUserProfile, verifyUser } from '@/services/users'

const props = defineProps({
  modelValue: Boolean,
  userId: {
    type: [Number, String],
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'updated'])

const MEDIA_BASE_URL = 'http://belluccidesign.gold'

const isLoading = ref(false)
const isSaving = ref(false)
const errorMessage = ref('')
const profile = ref(null)

const roleOptions = [
  { title: 'Customer', value: 'customer' },
  { title: 'Staff', value: 'staff' },
  { title: 'Admin', value: 'admin' },
]

const isOpen = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

function fullProfilePicture(url) {
  if (!url)
    return ''

  return url.startsWith('http') ? url : `${MEDIA_BASE_URL}${url}`
}

const profileForm = ref({
  person_name: '',
  company_name: '',
  address: '',
  city: '',
  country: '',
  role: '',
  is_verified: false,
  is_active: false,
})

async function loadProfile() {
  if (!props.userId)
    return

  isLoading.value = true
  errorMessage.value = ''

  try {
    profile.value = await fetchUserProfile(props.userId)
    profileForm.value = {
      person_name: profile.value.person_name || '',
      company_name: profile.value.company_name || '',
      address: profile.value.address || '',
      city: profile.value.city || '',
      country: profile.value.country || '',
      role: profile.value.role || '',
      is_verified: profile.value.is_verified,
      is_active: profile.value.is_active,
    }
  }
  catch (error) {
    errorMessage.value = error?.response?.data?.detail || 'Unable to load profile.'
  }
  finally {
    isLoading.value = false
  }
}

async function saveProfile() {
  isSaving.value = true
  errorMessage.value = ''

  try {
    await updateUserProfile(props.userId, profileForm.value)
    emit('updated')
    isOpen.value = false
  }
  catch (error) {
    errorMessage.value = error?.response?.data?.detail || 'Unable to save changes.'
  }
  finally {
    isSaving.value = false
  }
}

async function toggleVerify() {
  isSaving.value = true
  errorMessage.value = ''

  try {
    await verifyUser(props.userId, !profileForm.value.is_verified)
    profileForm.value.is_verified = !profileForm.value.is_verified
    emit('updated')
  }
  catch (error) {
    errorMessage.value = error?.response?.data?.detail || 'Unable to change verification status.'
  }
  finally {
    isSaving.value = false
  }
}

watch(() => props.userId, (val) => {
  if (val && isOpen.value)
    loadProfile()
})

watch(isOpen, (val) => {
  if (val && props.userId)
    loadProfile()
})
</script>

<template>
  <VDialog
    v-model="isOpen"
    max-width="700"
    scrollable
  >
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between">
        <span>User Profile</span>
        <VBtn
          icon
          variant="text"
          size="small"
          @click="isOpen = false"
        >
          <VIcon icon="bx-x" />
        </VBtn>
      </VCardTitle>

      <VDivider />

      <VCardText>
        <div
          v-if="isLoading"
          class="d-flex justify-center py-6"
        >
          <VProgressCircular
            indeterminate
            color="primary"
          />
        </div>

        <template v-else-if="profile">
          <VRow>
            <VCol cols="12">
              <div class="d-flex align-center gap-4 mb-4">
                <VAvatar
                  size="80"
                  color="primary"
                  variant="tonal"
                >
                  <VImg
                    v-if="profile.profile_picture"
                    :src="fullProfilePicture(profile.profile_picture)"
                    cover
                  />
                  <span
                    v-else
                    class="text-h4"
                  >
                    {{ profile.person_name?.charAt(0) || profile.email?.charAt(0) || '?' }}
                  </span>
                </VAvatar>
                <div>
                  <div class="text-h6">
                    {{ profile.person_name || '—' }}
                  </div>
                  <div class="text-body-2 text-medium-emphasis">
                    {{ profile.email }}
                  </div>
                  <div
                    v-if="profile.phone_number"
                    class="text-body-2 text-medium-emphasis"
                  >
                    {{ formatPhoneNumber(profile.phone_number) }}
                  </div>
                </div>
              </div>
            </VCol>
          </VRow>

          <VAlert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            class="mb-4"
          >
            {{ errorMessage }}
          </VAlert>

          <VRow>
            <VCol
              cols="12"
              sm="6"
            >
              <VTextField
                v-model="profileForm.person_name"
                label="Full Name"
                density="compact"
              />
            </VCol>
            <VCol
              cols="12"
              sm="6"
            >
              <VTextField
                v-model="profileForm.company_name"
                label="Company Name"
                density="compact"
              />
            </VCol>
            <VCol
              cols="12"
              sm="6"
            >
              <VSelect
                v-model="profileForm.role"
                :items="roleOptions"
                label="Role"
                density="compact"
              />
            </VCol>
            <VCol
              cols="12"
              sm="6"
            >
              <VTextField
                v-model="profileForm.country"
                label="Country"
                density="compact"
              />
            </VCol>
            <VCol
              cols="12"
              sm="6"
            >
              <VTextField
                v-model="profileForm.city"
                label="City"
                density="compact"
              />
            </VCol>
            <VCol
              cols="12"
              sm="6"
            >
              <VTextField
                v-model="profileForm.address"
                label="Address"
                density="compact"
              />
            </VCol>
            <VCol cols="12">
              <div class="d-flex gap-4">
                <VSwitch
                  v-model="profileForm.is_verified"
                  label="Verified"
                  color="success"
                  :disabled="isSaving"
                  @click.prevent="toggleVerify"
                />
                <VSwitch
                  v-model="profileForm.is_active"
                  label="Active"
                  color="success"
                  :disabled="isSaving"
                />
              </div>
            </VCol>
          </VRow>
        </template>
      </VCardText>

      <VDivider />

      <VCardActions>
        <VSpacer />
        <VBtn
          variant="text"
          :disabled="isSaving"
          @click="isOpen = false"
        >
          Cancel
        </VBtn>
        <VBtn
          color="primary"
          :loading="isSaving"
          @click="saveProfile"
        >
          Save
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup>
import { formatPhoneNumber } from '@/@core/utils/formatters'
import { checkAuthStatus, getUserProfile, putUserProfile } from '@/services/auth'

function createEmptyAccountData() {
  return {
    email: '',
    phone_number: '',
    company_name: '',
    person_name: '',
    address: '',
    city: '',
    country: '',
    profile_picture: '',
    shop_name: '',
  }
}

const refInputEl = ref()
const accountDataLocal = reactive(createEmptyAccountData())
const initialAccountData = ref(createEmptyAccountData())
const profilePictureFile = ref(null)
const isLoadingProfile = ref(false)
const isSavingProfile = ref(false)
const profileError = ref('')
const isSeller = ref(false)

const accountAvatar = computed(() => accountDataLocal.profile_picture || null)

function syncInitialAccountData(accountData) {
  initialAccountData.value = structuredClone(accountData)
}

const isAccountDeactivated = ref(false)

async function loadProfile() {
  isLoadingProfile.value = true
  profileError.value = ''

  try {
    const authStatus = await checkAuthStatus()

    isSeller.value = authStatus.role === 'seller'

    const profile = await getUserProfile()

    Object.assign(accountDataLocal, profile)
    if (accountDataLocal.phone_number)
      accountDataLocal.phone_number = formatPhoneNumber(accountDataLocal.phone_number)
    profilePictureFile.value = null
    syncInitialAccountData(profile)
  }
  catch (error) {
    profileError.value = 'Loading profile data failed.'
    console.error('Error loading user profile:', error)
  }
  finally {
    isLoadingProfile.value = false
  }
}

function resetForm() {
  Object.assign(accountDataLocal, structuredClone(initialAccountData.value))
  profilePictureFile.value = null
}

async function saveProfile() {
  if (isSeller.value) {
    profileError.value = 'Sellers are not able to edit the customer profile.'

    return
  }

  isSavingProfile.value = true
  profileError.value = ''

  try {
    const updatedProfile = await putUserProfile({
      email: accountDataLocal.email,
      phone_number: accountDataLocal.phone_number,
      company_name: accountDataLocal.company_name,
      person_name: accountDataLocal.person_name,
      address: accountDataLocal.address,
      city: accountDataLocal.city,
      country: accountDataLocal.country,
      profile_picture: accountDataLocal.profile_picture,
      profile_picture_file: profilePictureFile.value,
    })

    Object.assign(accountDataLocal, updatedProfile)
    profilePictureFile.value = null
    syncInitialAccountData(updatedProfile)
  }
  catch (error) {
    if (error?.response?.status === 403) {
      profileError.value = 'Sellers are not able to edit the customer profile.'
    }
    else {
      profileError.value = 'Saving profile changes failed.'
    }
    console.error('Error saving user profile:', error)
  }
  finally {
    isSavingProfile.value = false
  }
}

function changeAvatar(file) {
  const fileReader = new FileReader()
  const { files } = file.target
  if (files && files.length) {
    profilePictureFile.value = files[0]
    fileReader.readAsDataURL(files[0])
    fileReader.onload = () => {
      if (typeof fileReader.result === 'string')
        accountDataLocal.profile_picture = fileReader.result
    }
  }
}

// reset avatar image
function resetAvatar() {
  accountDataLocal.profile_picture = initialAccountData.value.profile_picture || ''
  profilePictureFile.value = null
}

onMounted(loadProfile)
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard title="Account Details">
        <VCardText
          v-if="profileError"
          class="pb-0"
        >
          <VAlert
            type="error"
            variant="tonal"
            density="comfortable"
          >
            {{ profileError }}
          </VAlert>
        </VCardText>

        <VCardText class="d-flex">
          <!-- 👉 Avatar -->
          <VAvatar
            v-if="accountAvatar"
            rounded="lg"
            size="100"
            class="me-6"
            :image="accountAvatar"
          />
          <VAvatar
            v-else
            rounded="lg"
            size="100"
            class="me-6"
            color="primary"
            variant="tonal"
          >
            <VIcon
              icon="bx-user"
              size="48"
            />
          </VAvatar>

          <!-- 👉 Upload Photo -->
          <form class="d-flex flex-column justify-center gap-5">
            <div class="d-flex flex-wrap gap-2">
              <VBtn
                type="button"
                color="primary"
                @click="refInputEl?.click()"
              >
                <VIcon
                  icon="bx-cloud-upload"
                  class="d-sm-none"
                />
                <span class="d-none d-sm-block">Upload New Photo</span>
              </VBtn>

              <input
                ref="refInputEl"
                type="file"
                name="file"
                accept="image/*"
                hidden
                @input="changeAvatar"
              >

              <VBtn
                type="button"
                color="error"
                variant="tonal"
                @click="resetAvatar"
              >
                <span class="d-none d-sm-block">Reset</span>
                <VIcon
                  icon="bx-refresh"
                  class="d-sm-none"
                />
              </VBtn>
            </div>

            <p class="text-body-1 mb-0">
              Only JPG, GIF, or PNG allowed.
            </p>
          </form>
        </VCardText>

        <VDivider />

        <VCardText>
          <!-- 👉 Seller Info (read-only) -->
          <template v-if="isSeller">
            <VAlert
              type="info"
              variant="tonal"
              class="mb-4"
            >
              Sellers are not able to edit the customer profile.
            </VAlert>
            <VRow>
              <VCol cols="12" md="6">
                <div class="text-caption text-medium-emphasis mb-1">
                  Name
                </div>
                <div class="text-body-1 font-weight-medium">
                  {{ accountDataLocal.person_name || '—' }}
                </div>
              </VCol>
              <VCol cols="12" md="6">
                <div class="text-caption text-medium-emphasis mb-1">
                  Phone Number
                </div>
                <div class="text-body-1 font-weight-medium">
                  {{ accountDataLocal.phone_number || '—' }}
                </div>
              </VCol>
              <VCol cols="12" md="6">
                <div class="text-caption text-medium-emphasis mb-1">
                  Shop Name
                </div>
                <div class="text-body-1 font-weight-medium">
                  {{ accountDataLocal.shop_name || '—' }}
                </div>
              </VCol>
              <VCol cols="12" md="6">
                <div class="text-caption text-medium-emphasis mb-1">
                  Status
                </div>
                <VChip
                  :color="accountDataLocal.is_active ? 'success' : 'error'"
                  size="small"
                  label
                  variant="tonal"
                >
                  {{ accountDataLocal.is_active ? 'Active' : 'Inactive' }}
                </VChip>
              </VCol>
            </VRow>
          </template>

          <!-- 👉 Customer Form -->
          <VForm
            v-else
            class="mt-6"
            @submit.prevent="saveProfile"
          >
            <VRow>
              <!-- 👉 Email -->
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="accountDataLocal.email"
                  label="Email"
                  type="email"
                />
              </VCol>

              <!-- 👉 Phone -->
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="accountDataLocal.phone_number"
                  label="Phone Number"
                />
              </VCol>

              <!-- 👉 Full Name -->
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="accountDataLocal.person_name"
                  label="Full Name"
                />
              </VCol>

              <!-- 👉 Company -->
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="accountDataLocal.company_name"
                  label="Company Name"
                />
              </VCol>

              <!-- 👉 Address -->
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="accountDataLocal.address"
                  label="Address"
                />
              </VCol>

              <!-- 👉 City -->
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="accountDataLocal.city"
                  label="City"
                />
              </VCol>

              <!-- 👉 Country -->
              <VCol
                cols="12"
                md="6"
              >
                <VSelect
                  v-model="accountDataLocal.country"
                  label="Country"
                  :items="['Iran', 'USA', 'Canada', 'UK', 'India', 'Australia']"
                  placeholder="Select Country"
                />
              </VCol>

              <!-- 👉 Form Actions -->
              <VCol
                cols="12"
                class="d-flex flex-wrap gap-4"
              >
                <VBtn
                  type="submit"
                  :loading="isSavingProfile"
                  :disabled="isLoadingProfile || isSavingProfile"
                >
                  Save Changes
                </VBtn>

                <VBtn
                  color="secondary"
                  variant="tonal"
                  type="reset"
                  @click.prevent="resetForm"
                >
                  Reset
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>

    <VCol cols="12">
      <!-- 👉 Deactivate Account -->
      <VCard title="Deactivate Account">
        <VCardText>
          <div>
            <VCheckbox
              v-model="isAccountDeactivated"
              label="I confirm that I want to deactivate my account"
            />
          </div>

          <VBtn
            :disabled="!isAccountDeactivated"
            color="error"
            class="mt-3"
          >
            Deactivate Account
          </VBtn>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

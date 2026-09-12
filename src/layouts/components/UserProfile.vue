<script setup>
import { useRouter } from 'vue-router'
import { formatPhoneNumber } from '@/@core/utils/formatters'
import { getUserProfile, logout } from '@/services/auth'

const router = useRouter()

const userProfile = ref({
  email: '',
  phone_number: '',
  company_name: '',
  person_name: '',
  address: '',
  city: '',
  country: '',
  profile_picture: '',
})

const profileImage = computed(() => userProfile.value.profile_picture || null)
const profileName = computed(() => userProfile.value.person_name || userProfile.value.email || 'User')
const profileSubtitle = computed(() => userProfile.value.company_name || formatPhoneNumber(userProfile.value.phone_number) || 'Account')

async function loadUserProfile() {
  try {
    userProfile.value = await getUserProfile()
  }
  catch (error) {
    console.error('Error loading user profile:', error)
  }
}

async function goToProfile() {
  await router.push('/account-settings')
}

async function handleLogout() {
  try {
    await logout()
  }
  catch (error) {
    console.error('Error logging out:', error)
  }
  finally {
    await router.push('/login')
  }
}

onMounted(loadUserProfile)
</script>

<template>
  <VAvatar
    class="cursor-pointer"
    color="primary"
    variant="tonal"
  >
    <VImg
      v-if="profileImage"
      :src="profileImage"
    />
    <VIcon
      v-else
      icon="bx-user"
    />

    <!-- SECTION Menu -->
    <VMenu
      activator="parent"
      width="230"
      location="bottom end"
      offset=".875rem"
    >
      <VList>
        <!-- 👉 User Avatar & Name -->
        <VListItem>
          <template #prepend>
            <VListItemAction start>
              <VAvatar
                color="primary"
                variant="tonal"
              >
                <VImg
                  v-if="profileImage"
                  :src="profileImage"
                />
                <VIcon
                  v-else
                  icon="bx-user"
                />
              </VAvatar>
            </VListItemAction>
          </template>

          <VListItemTitle class="font-weight-semibold">
            {{ profileName }}
          </VListItemTitle>
          <VListItemSubtitle>{{ profileSubtitle }}</VListItemSubtitle>
        </VListItem>
        <VDivider class="my-2" />

        <!-- 👉 Profile -->
        <VListItem
          link
          @click="goToProfile"
        >
          <template #prepend>
            <VIcon
              class="me-2"
              icon="bx-user"
              size="22"
            />
          </template>

          <VListItemTitle>Profile</VListItemTitle>
        </VListItem>

        <!-- 👉 Settings -->
        <VListItem link>
          <template #prepend>
            <VIcon
              class="me-2"
              icon="bx-cog"
              size="22"
            />
          </template>

          <VListItemTitle>Settings</VListItemTitle>
        </VListItem>

        <!-- 👉 Pricing -->
        <!--
          <VListItem link>
          <template #prepend>
          <VIcon
          class="me-2"
          icon="bx-dollar"
          size="22"
          />
          </template>

          <VListItemTitle>Prices</VListItemTitle>
          </VListItem>
        -->

        <!-- 👉 FAQ -->
        <!--
          <VListItem link>
          <template #prepend>
          <VIcon
          class="me-2"
          icon="bx-help-circle"
          size="22"
          />
          </template>

          <VListItemTitle>FAQ</VListItemTitle>
          </VListItem>
        -->

        <!-- Divider -->
        <VDivider class="my-2" />

        <!-- 👉 Logout -->
        <VListItem
          link
          @click="handleLogout"
        >
          <template #prepend>
            <VIcon
              class="me-2"
              icon="bx-log-out"
              size="22"
            />
          </template>

          <VListItemTitle>Logout</VListItemTitle>
        </VListItem>
      </VList>
    </VMenu>
    <!-- !SECTION -->
  </VAvatar>
</template>

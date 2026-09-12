<script setup>
import { checkAuthStatus } from '@/services/auth'
import { fetchProductVariantBySku, sellProduct, updateProductVariant } from '@/services/products'
import { fetchUsers } from '@/services/users'

const route = useRoute()
const sku = computed(() => route.params.sku)
const MEDIA_BASE_URL = 'http://belluccidesign.gold'

const variant = ref(null)
const isLoading = ref(true)
const errorMessage = ref('')
const userRole = ref(null)

const activeImageIndex = ref(0)
const previewDialogOpen = ref(false)

const sellDialogOpen = ref(false)
const isSelling = ref(false)
const sellSuccess = ref(false)
const customerSearch = ref('')
const customerSearchResults = ref([])
const isSearchingCustomers = ref(false)
const selectedCustomer = ref(null)
const showNewCustomerForm = ref(false)

const newCustomerForm = ref({
  customer_name: '',
  customer_phone: '',
})

const sellFeeForm = ref({
  fee: '',
  fee_type: 'percent',
})

const CART_STORAGE_KEY = 'goldcraft_sell_cart'
const cartItems = ref(JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]'))
const cartDialogOpen = ref(false)
const checkoutDialogOpen = ref(false)
const isCheckingOut = ref(false)

const toast = ref(false)
const toastMessage = ref('')
const toastColor = ref('success')
const toastIcon = ref('bx-check-circle')
let toastTimer = null

function showToast(message, color = 'success', icon = 'bx-check-circle') {
  clearTimeout(toastTimer)
  toastMessage.value = message
  toastColor.value = color
  toastIcon.value = icon
  toast.value = true
  toastTimer = setTimeout(() => { toast.value = false }, 3000)
}

const cartPulse = ref(false)

function pulseCart() {
  cartPulse.value = true
  setTimeout(() => { cartPulse.value = false }, 600)
}

function saveCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems.value))
}

function addToCart() {
  if (!variant.value) return

  const item = {
    id: Date.now(),
    variant_id: variant.value.id,
    sku: variant.value.sku,
    product_name: variant.value.product_name,
    fee: hasFeeDetails.value ? variant.value.fee : sellFeeForm.value.fee,
    fee_type: hasFeeDetails.value ? variant.value.fee_type : sellFeeForm.value.fee_type,
    weight: variant.value.weight,
    image: allImages.value[0]?.fullUrl || null,
    added_at: new Date().toISOString(),
  }

  cartItems.value.push(item)
  saveCart()
  sellDialogOpen.value = false
  resetSellDialog()
  pulseCart()
  showToast(`"${variant.value.product_name}" added to cart`, 'success', 'bx-cart-add')
}

function removeFromCart(itemId) {
  cartItems.value = cartItems.value.filter(i => i.id !== itemId)
  saveCart()
}

function clearCart() {
  cartItems.value = []
  saveCart()
}

const cartCount = computed(() => cartItems.value.length)

const hasFeeDetails = computed(() => {
  const v = variant.value
  return v && v.fee && v.weight
})

function fullImageUrl(url) {
  if (!url)
    return ''

  return url.startsWith('http') ? url : `${MEDIA_BASE_URL}${url}`
}

const allImages = computed(() => {
  if (!variant.value?.images?.length)
    return []

  return variant.value.images.map(img => ({
    ...img,
    fullUrl: fullImageUrl(img.image),
  }))
})

const activeImage = computed(() => allImages.value[activeImageIndex.value]?.fullUrl || null)

function normalizeText(value) {
  return `${value ?? ''}`.trim().toLowerCase()
}

let searchDebounce = null

async function searchCustomers(query) {
  const q = normalizeText(query)
  if (!q) {
    customerSearchResults.value = []
    isSearchingCustomers.value = false

    return
  }

  isSearchingCustomers.value = true

  try {
    const response = await fetchUsers({ search: q })

    customerSearchResults.value = Array.isArray(response.results) ? response.results : []
  }
  catch {
    customerSearchResults.value = []
  }
  finally {
    isSearchingCustomers.value = false
  }
}

function onCustomerSearchInput(value) {
  clearTimeout(searchDebounce)
  if (!value) {
    customerSearchResults.value = []

    return
  }
  searchDebounce = setTimeout(searchCustomers, 350, value)
}

function selectCustomer(user) {
  selectedCustomer.value = user
  newCustomerForm.value.customer_name = user.person_name || ''
  newCustomerForm.value.customer_phone = user.phone_number || ''
  customerSearch.value = ''
  customerSearchResults.value = []
}

function clearCustomerSelection() {
  selectedCustomer.value = null
  newCustomerForm.value.customer_name = ''
  newCustomerForm.value.customer_phone = ''
}

function openNewCustomerForm() {
  showNewCustomerForm.value = true
  newCustomerForm.value.customer_name = ''
  newCustomerForm.value.customer_phone = ''
}

function resetSellDialog() {
  customerSearch.value = ''
  customerSearchResults.value = []
  selectedCustomer.value = null
  showNewCustomerForm.value = false
  newCustomerForm.value = { customer_name: '', customer_phone: '' }
  sellFeeForm.value = { fee: '', fee_type: 'percent' }
  sellSuccess.value = false
  errorMessage.value = ''
}

async function loadVariant() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    variant.value = await fetchProductVariantBySku(sku.value)
    activeImageIndex.value = 0
  }
  catch (error) {
    variant.value = null
    errorMessage.value = error?.response?.data?.detail || 'Unable to load product information.'
  }
  finally {
    isLoading.value = false
  }
}

const floatingBtnBounce = ref(false)

function handleFloatingSell() {
  floatingBtnBounce.value = true
  setTimeout(() => {
    floatingBtnBounce.value = false
    sellDialogOpen.value = true
  }, 300)
}

async function handleAddToCart() {
  isSelling.value = true
  errorMessage.value = ''

  try {
    if (!hasFeeDetails.value) {
      const formData = new FormData()
      formData.append('fee', sellFeeForm.value.fee)
      formData.append('fee_type', sellFeeForm.value.fee_type)
      formData.append('weight', variant.value?.weight || sellFeeForm.value.weight)
      await updateProductVariant(variant.value.id, formData)
      await loadVariant()
    }

    addToCart()
  }
  catch (error) {
    errorMessage.value = error?.response?.data?.detail || 'Unable to add to cart.'
  }
  finally {
    isSelling.value = false
  }
}

async function handleCheckout() {
  if (!newCustomerForm.value.customer_name || !newCustomerForm.value.customer_phone)
    return

  isCheckingOut.value = true
  errorMessage.value = ''

  try {
    for (const item of cartItems.value) {
      await sellProduct({
        sku: item.sku,
        customer_name: newCustomerForm.value.customer_name,
        customer_phone: newCustomerForm.value.customer_phone,
      })
    }

    const soldCount = cartItems.value.length
    clearCart()
    checkoutDialogOpen.value = false
    resetSellDialog()
    sellSuccess.value = true
    showToast(`${soldCount} item(s) sold successfully`, 'success', 'bx-check-circle')
    await loadVariant()
  }
  catch (error) {
    errorMessage.value = error?.response?.data?.detail || 'Unable to register sale.'
  }
  finally {
    isCheckingOut.value = false
  }
}

onMounted(async () => {
  try {
    const { role } = await checkAuthStatus()
    userRole.value = role
  }
  catch {
    userRole.value = null
  }
  await loadVariant()
})
</script>

<template>
  <div class="variant-page">
    <div class="variant-page-inner">
      <div
        v-if="isLoading"
        class="loading-state d-flex flex-column align-center justify-center"
      >
        <VProgressCircular
          indeterminate
          color="primary"
          size="44"
          width="3"
        />
        <div class="text-caption text-medium-emphasis mt-4">
          Loading...
        </div>
      </div>

      <div
        v-else-if="errorMessage && !variant"
        class="error-state d-flex flex-column align-center justify-center"
      >
        <VIcon
          icon="bx-error"
          size="56"
          color="error"
          class="mb-4"
        />
        <div class="text-h6 font-weight-bold mb-2">
          Loading Error
        </div>
        <div class="text-body-2 text-medium-emphasis">
          {{ errorMessage }}
        </div>
        <VBtn
          variant="tonal"
          color="primary"
          class="mt-6"
          prepend-icon="bx-refresh"
          @click="loadVariant"
        >
          Try Again
        </VBtn>
      </div>

      <template v-else-if="variant">
        <div class="product-layout">
          <div class="product-gallery">
            <div
              class="gallery-main"
              @click="previewDialogOpen = true"
            >
              <Transition
                name="fade"
                mode="out-in"
              >
                <VImg
                  v-if="activeImage"
                  :key="activeImage"
                  :src="activeImage"
                  class="gallery-main-img"
                  cover
                />
                <div
                  v-else
                  class="gallery-empty d-flex align-center justify-center flex-column"
                >
                  <VIcon
                    icon="bx-image"
                    size="72"
                    color="disabled"
                  />
                  <div class="text-caption text-medium-emphasis mt-2">
                    No Image
                  </div>
                </div>
              </Transition>

              <div
                v-if="allImages.length > 1"
                class="gallery-main-overlay d-flex align-center justify-center"
              >
                <VIcon
                  icon="bx-expand"
                  size="28"
                  color="white"
                />
              </div>
            </div>

            <div
              v-if="allImages.length > 1"
              class="gallery-thumbs"
            >
              <button
                v-for="(img, idx) in allImages"
                :key="img.id"
                class="gallery-thumb"
                :class="{ 'gallery-thumb--active': activeImageIndex === idx }"
                @click="activeImageIndex = idx"
              >
                <VImg
                  :src="img.fullUrl"
                  cover
                />
              </button>
            </div>
          </div>

          <div class="product-info">
            <div class="product-info-top">
              <div class="product-sku">
                {{ variant.sku }}
              </div>

              <h1 class="product-title">
                {{ variant.product_name || '—' }}
              </h1>

              <div
                v-if="variant.colors?.length"
                class="product-colors d-flex gap-2 flex-wrap"
              >
                <div
                  v-for="color in variant.colors"
                  :key="color.id"
                  class="color-tag d-flex align-center gap-2"
                >
                  <span
                    class="color-swatch"
                    :style="{ backgroundColor: color.code }"
                  />
                  <span class="color-name">{{ color.name }}</span>
                </div>
              </div>
            </div>

            <div class="product-meta">
              <div class="meta-card">
                <div class="meta-icon meta-icon--info">
                  <VIcon
                    icon="bx-dollar"
                    size="20"
                  />
                </div>
                <div>
                  <div class="meta-label">
                    Commission
                  </div>
                  <div class="meta-value">
                    {{ variant.fee ?? '—' }} {{ variant.fee_type === 'fixed' ? 'IRR' : '%' }}
                  </div>
                </div>
              </div>

              <div class="meta-card">
                <div
                  class="meta-icon"
                  :class="hasFeeDetails ? 'meta-icon--success' : 'meta-icon--error'"
                >
                  <VIcon
                    :icon="hasFeeDetails ? 'bx-check' : 'bx-x'"
                    size="20"
                  />
                </div>
                <div>
                  <div class="meta-label">
                    Commission
                  </div>
                  <div class="meta-value">
                    {{ hasFeeDetails ? 'Defined' : 'Not Defined' }}
                  </div>
                </div>
              </div>

              <div class="meta-card">
                <div class="meta-icon meta-icon--info">
                  <VIcon
                    icon="bx-diamond"
                    size="20"
                  />
                </div>
                <div>
                  <div class="meta-label">
                    Weight
                  </div>
                  <div class="meta-value">
                    {{ variant.weight ?? '—' }} g
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="hasFeeDetails"
              class="fee-section"
            >
              <div class="fee-header d-flex align-center justify-space-between">
                <div class="fee-title">
                  Commission Details
                </div>
              </div>
              <div class="fee-body">
                <div class="fee-row">
                  <span class="fee-key">Commission</span>
                  <span class="fee-val">{{ variant.fee ?? '—' }} {{ variant.fee_type === 'fixed' ? 'IRR' : '%' }}</span>
                </div>
                <div class="fee-row">
                  <span class="fee-key">Weight</span>
                  <span class="fee-val">{{ variant.weight ?? '—' }} g</span>
                </div>
              </div>
            </div>

            <VSlideYTransition>
              <VAlert
                v-if="sellSuccess"
                type="success"
                variant="tonal"
                density="comfortable"
                class="mb-4"
                closable
                @click:close="sellSuccess = false"
              >
                Sale registered successfully.
              </VAlert>
            </VSlideYTransition>

            <VSlideYTransition>
              <VAlert
                v-if="errorMessage && variant"
                type="error"
                variant="tonal"
                density="comfortable"
                class="mb-4"
                closable
                @click:close="errorMessage = ''"
              >
                {{ errorMessage }}
              </VAlert>
            </VSlideYTransition>

            <VBtn
              v-if="variant.is_active"
              color="primary"
              variant="flat"
              size="x-large"
              block
              prepend-icon="bx-cart-add"
              class="sell-button"
              @click="sellDialogOpen = true"
            >
              <span class="me-1">Add to Cart</span>
            </VBtn>

            <div
              v-else-if="!variant.is_active"
              class="unavailable-banner"
            >
              <VIcon
                icon="bx-block"
                size="20"
              />
              <span>This product is inactive</span>
            </div>
          </div>
        </div>
      </template>
    </div>

    <VBtn
      v-if="variant && variant.is_active"
      color="primary"
      size="large"
      class="floating-sell-btn d-flex d-md-none"
      :class="{ 'floating-sell-btn--bounce': floatingBtnBounce }"
      elevation="8"
      @click="handleFloatingSell"
    >
      <VIcon
        icon="bx-cart-add"
        size="20"
        class="me-1"
      />
      <span>Add to Cart</span>
    </VBtn>

    <VBtn
      v-if="cartCount > 0"
      icon
      color="secondary"
      size="large"
      class="floating-cart-btn"
      :class="{ 'floating-cart-btn--pulse': cartPulse }"
      elevation="8"
      @click="cartDialogOpen = true"
    >
      <VBadge
        :content="cartCount"
        color="error"
        floating
        offset-x="-4"
        offset-y="-4"
      >
        <VIcon icon="bx-cart" size="24" />
      </VBadge>
    </VBtn>

    <VDialog
      v-model="sellDialogOpen"
      max-width="480"
      :scrim-opacity="0.5"
      @update:model-value="val => { if (val) resetSellDialog() }"
    >
      <VCard class="dialog-card">
        <div class="dialog-header">
          <div class="dialog-header-icon">
            <VIcon icon="bx-cart-add" size="22" />
          </div>
          <div>
            <div class="dialog-title">
              Add to Cart
            </div>
            <div class="dialog-subtitle">
              {{ variant?.product_name }} — {{ variant?.sku }}
            </div>
          </div>
        </div>

        <VDivider />

        <VCardText class="pa-5">
          <VAlert
            v-if="hasFeeDetails"
            type="success"
            variant="tonal"
            density="comfortable"
            class="mb-0"
            prepend-icon="bx-check-circle"
          >
            Commission for this product has been defined previously. Click "Add to Cart" to add it to the cart.
          </VAlert>

          <template v-else>
            <VAlert
              type="warning"
              variant="tonal"
              density="comfortable"
              class="mb-4"
              prepend-icon="bx-error"
            >
              Commission for this product has not been defined. Please enter the commission.
            </VAlert>
            <VRow>
              <VCol cols="12">
                <VTextField
                  v-model="sellFeeForm.fee"
                  label="Commission"
                  type="number"
                  density="comfortable"
                  variant="outlined"
                  prepend-inner-icon="bx-dollar"
                  rounded="lg"
                />
              </VCol>
              <VCol :cols="variant?.weight ? 6 : 12">
                <VSelect
                  v-model="sellFeeForm.fee_type"
                  label="Commission Type"
                  :items="[
                    { title: 'Percent', value: 'percent' },
                    { title: 'Fixed', value: 'fixed' },
                  ]"
                  item-title="title"
                  item-value="value"
                  density="comfortable"
                  variant="outlined"
                  rounded="lg"
                />
              </VCol>
              <VCol v-if="!variant?.weight" cols="6">
                <VTextField
                  v-model="sellFeeForm.weight"
                  label="Weight (g)"
                  type="number"
                  density="comfortable"
                  variant="outlined"
                  prepend-inner-icon="bx-diamond"
                  rounded="lg"
                />
              </VCol>
            </VRow>
          </template>
        </VCardText>

        <VDivider />

        <VCardActions class="dialog-actions">
          <VBtn
            variant="outlined"
            size="large"
            rounded="lg"
            :disabled="isSelling"
            @click="sellDialogOpen = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="primary"
            variant="flat"
            size="large"
            rounded="lg"
            :loading="isSelling"
            :disabled="!hasFeeDetails && (!sellFeeForm.fee || (!variant?.weight && !sellFeeForm.weight))"
            @click="handleAddToCart"
          >
            <VIcon
              start
              icon="bx-cart-add"
            />
            Add to Cart
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VDialog
      v-model="cartDialogOpen"
      max-width="520"
      :scrim-opacity="0.5"
    >
      <VCard class="dialog-card">
        <div class="dialog-header dialog-header--cart">
          <div class="dialog-header-icon dialog-header-icon--secondary">
            <VIcon icon="bx-cart" size="22" />
          </div>
          <div class="flex-grow-1">
            <div class="dialog-title">
              Sales Cart
            </div>
            <div class="dialog-subtitle">
              {{ cartCount }} item(s) in cart
            </div>
          </div>
          <VBtn
            icon
            size="small"
            variant="text"
            color="error"
            @click="clearCart"
          >
            <VIcon icon="bx-trash" size="20" />
          </VBtn>
        </div>

        <VDivider />

        <VCardText class="pa-0 cart-items-scroll">
          <template v-if="cartItems.length > 0">
            <div
              v-for="item in cartItems"
              :key="item.id"
              class="cart-item"
            >
              <div class="d-flex align-center gap-3">
                <div class="cart-item-img-wrapper">
                  <VImg
                    v-if="item.image"
                    :src="item.image"
                    width="64"
                    height="64"
                    cover
                    rounded="lg"
                  />
                  <div
                    v-else
                    class="cart-item-thumb d-flex align-center justify-center"
                  >
                    <VIcon icon="bx-image" size="28" color="disabled" />
                  </div>
                </div>
                <div class="flex-grow-1 min-w-0">
                  <div class="cart-item-name text-truncate">
                    {{ item.product_name }}
                  </div>
                  <div class="cart-item-sku">
                    {{ item.sku }}
                  </div>
                  <div class="cart-item-details d-flex gap-2 mt-1">
                    <span class="cart-chip cart-chip--fee">
                      <VIcon icon="bx-dollar" size="14" />
                      {{ item.fee }} {{ item.fee_type === 'fixed' ? 'IRR' : '%' }}
                    </span>
                    <span class="cart-chip cart-chip--weight">
                      <VIcon icon="bx-diamond" size="14" />
                      {{ item.weight }} g
                    </span>
                  </div>
                </div>
                <VBtn
                  icon
                  size="small"
                  variant="text"
                  color="error"
                  class="flex-shrink-0"
                  @click="removeFromCart(item.id)"
                >
                  <VIcon icon="bx-trash" size="18" />
                </VBtn>
              </div>
            </div>
          </template>
          <div
            v-else
            class="cart-empty d-flex flex-column align-center justify-center pa-8"
          >
            <div class="cart-empty-icon mb-3">
              <VIcon icon="bx-cart" size="48" color="disabled" />
            </div>
            <div class="text-body-1 font-weight-bold text-medium-emphasis mb-1">
              Cart is empty
            </div>
            <div class="text-caption text-medium-emphasis">
              Scan products to add them to the cart
            </div>
          </div>
        </VCardText>

        <VDivider />

        <VCardActions class="dialog-actions">
          <VBtn
            variant="outlined"
            size="large"
            rounded="lg"
            @click="cartDialogOpen = false"
          >
            Close
          </VBtn>
          <VBtn
            color="primary"
            variant="flat"
            size="large"
            rounded="lg"
            prepend-icon="bx-check"
            @click="cartDialogOpen = false; checkoutDialogOpen = true"
          >
            Register Sale ({{ cartCount }})
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VDialog
      v-model="checkoutDialogOpen"
      max-width="480"
      :scrim-opacity="0.5"
      @update:model-value="val => { if (val) resetSellDialog() }"
    >
      <VCard class="dialog-card">
        <div class="dialog-header">
          <div class="dialog-header-icon dialog-header-icon--success">
            <VIcon icon="bx-check-circle" size="22" />
          </div>
          <div>
            <div class="dialog-title">
              Register Sale
            </div>
            <div class="dialog-subtitle">
              {{ cartCount }} item(s) — Enter customer information
            </div>
          </div>
        </div>

        <VDivider />

        <VCardText class="pa-5">
          <div
            v-if="selectedCustomer"
            class="selected-customer mb-4"
          >
            <div class="selected-customer-info d-flex align-center gap-3">
              <VAvatar
                color="primary"
                variant="tonal"
                size="42"
              >
                <span class="text-caption font-weight-bold">
                  {{ selectedCustomer.person_name?.charAt(0) || '?' }}
                </span>
              </VAvatar>
              <div class="flex-grow-1 min-w-0">
                <div class="text-body-2 font-weight-bold">
                  {{ selectedCustomer.person_name }}
                </div>
                <div
                  class="text-caption text-medium-emphasis"
                  dir="ltr"
                >
                  {{ selectedCustomer.phone_number }}
                </div>
              </div>
              <VBtn
                icon
                size="small"
                variant="text"
                color="error"
                @click="clearCustomerSelection"
              >
                <VIcon icon="bx-x" size="18" />
              </VBtn>
            </div>
          </div>

          <template v-else>
            <VTextField
              v-model="customerSearch"
              label="Search Customer (Name or Phone)"
              density="comfortable"
              variant="outlined"
              prepend-inner-icon="bx-search"
              rounded="lg"
              clearable
              hide-details
              class="mb-3"
              autofocus
              @update:model-value="onCustomerSearchInput"
              @click:clear="customerSearch = ''; customerSearchResults = []"
            />

            <div
              v-if="isSearchingCustomers"
              class="d-flex justify-center py-3 mb-3"
            >
              <VProgressCircular
                indeterminate
                color="primary"
                size="24"
                width="2"
              />
            </div>

            <div
              v-else-if="customerSearch && customerSearchResults.length > 0"
              class="customer-results mb-3"
            >
              <div
                v-for="user in customerSearchResults"
                :key="user.id"
                class="customer-result-item d-flex align-center gap-3"
                @click="selectCustomer(user)"
              >
                <VAvatar
                  color="primary"
                  variant="tonal"
                  size="36"
                >
                  <span class="text-caption">
                    {{ user.person_name?.charAt(0) || '?' }}
                  </span>
                </VAvatar>
                <div class="flex-grow-1 min-w-0">
                  <div class="text-body-2 font-weight-medium">
                    {{ user.person_name || '—' }}
                  </div>
                  <div
                    class="text-caption text-medium-emphasis"
                    dir="ltr"
                  >
                    {{ user.phone_number || '—' }}
                  </div>
                </div>
                <VIcon
                  icon="bx-check-circle"
                  size="20"
                  color="primary"
                  class="flex-shrink-0"
                />
              </div>
            </div>

            <div
              v-else-if="customerSearch && customerSearchResults.length === 0 && !isSearchingCustomers"
              class="text-center py-3 mb-3"
            >
              <div class="text-body-2 text-medium-emphasis mb-1">
                Customer not found
              </div>
              <div class="text-caption text-medium-emphasis">
                You can add a new customer
              </div>
            </div>
          </template>

          <VSlideYTransition>
            <div v-if="showNewCustomerForm && !selectedCustomer">
              <VDivider class="mb-4" />
              <div class="text-body-2 font-weight-bold mb-3 d-flex align-center gap-2">
                <VIcon
                  icon="bx-user-plus"
                  size="18"
                  color="primary"
                />
                New Customer
              </div>
              <VRow>
                <VCol cols="12">
                  <VTextField
                    v-model="newCustomerForm.customer_name"
                    label="Customer Name"
                    :rules="[v => !!v || 'Name is required']"
                    density="comfortable"
                    variant="outlined"
                    prepend-inner-icon="bx-user"
                    rounded="lg"
                  />
                </VCol>
                <VCol cols="12">
                  <VTextField
                    v-model="newCustomerForm.customer_phone"
                    label="Customer Phone"
                    :rules="[v => !!v || 'Phone is required']"
                    density="comfortable"
                    variant="outlined"
                    prepend-inner-icon="bx-phone"
                    dir="ltr"
                    rounded="lg"
                  />
                </VCol>
              </VRow>
            </div>
          </VSlideYTransition>

          <VBtn
            v-if="!selectedCustomer && !showNewCustomerForm"
            variant="tonal"
            color="primary"
            block
            prepend-icon="bx-user-plus"
            class="mt-1"
            @click="openNewCustomerForm"
          >
            New Customer
          </VBtn>
        </VCardText>

        <VDivider />

        <VCardActions class="dialog-actions">
          <VBtn
            variant="outlined"
            size="large"
            rounded="lg"
            :disabled="isCheckingOut"
            @click="checkoutDialogOpen = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="primary"
            variant="flat"
            size="large"
            rounded="lg"
            :loading="isCheckingOut"
            :disabled="!newCustomerForm.customer_name || !newCustomerForm.customer_phone"
            @click="handleCheckout"
          >
            <VIcon
              start
              icon="bx-check"
            />
            Register Sale ({{ cartCount }})
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VDialog
      v-model="previewDialogOpen"
      max-width="960"
      content-class="preview-overlay"
      transition="dialog-bottom-transition"
      @click:outside="previewDialogOpen = false"
    >
      <div class="preview-box">
        <VBtn
          class="preview-close"
          icon="bx-x"
          variant="text"
          size="small"
          @click="previewDialogOpen = false"
        />
        <img
          v-if="activeImage"
          :src="activeImage"
          alt=""
          class="preview-img"
        >
      </div>
    </VDialog>

    <Transition name="toast-slide">
      <div
        v-if="toast"
        class="toast-custom"
        :class="`toast-custom--${toastColor}`"
      >
        <div class="toast-icon-wrapper">
          <VIcon :icon="toastIcon" size="20" />
        </div>
        <span class="toast-text">{{ toastMessage }}</span>
        <button
          class="toast-close"
          @click="toast = false"
        >
          <VIcon icon="bx-x" size="16" />
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ===== Page Shell ===== */
.variant-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9fc 0%, #f0f1f5 100%);
}

.variant-page-inner {
  max-width: 1020px;
  margin: 0 auto;
  padding: 32px 20px 64px;
}

/* ===== Loading & Error States ===== */
.loading-state,
.error-state {
  min-height: 60vh;
}

/* ===== Product Layout ===== */
.product-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  align-items: start;
}

/* ===== Gallery ===== */
.product-gallery {
  position: sticky;
  top: 32px;
}

.gallery-main {
  position: relative;
  aspect-ratio: 1;
  border-radius: 20px;
  overflow: hidden;
  background: #fff;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.04),
    0 8px 32px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.04);
  cursor: zoom-in;
}

.gallery-main-img {
  width: 100%;
  height: 100%;
}

.gallery-empty {
  width: 100%;
  height: 100%;
  min-height: 320px;
  background: #fafbfc;
}

.gallery-main-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.25s ease;
  backdrop-filter: blur(2px);
}

.gallery-main:hover .gallery-main-overlay {
  opacity: 1;
}

.gallery-thumbs {
  display: flex;
  gap: 10px;
  margin-top: 12px;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 2px;
}

.gallery-thumbs::-webkit-scrollbar {
  display: none;
}

.gallery-thumb {
  width: 72px;
  height: 72px;
  flex-shrink: 0;
  border-radius: 12px;
  overflow: hidden;
  border: 2.5px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0.55;
  background: #fff;
}

.gallery-thumb:hover {
  opacity: 0.85;
}

.gallery-thumb--active {
  border-color: rgb(var(--v-theme-primary));
  opacity: 1;
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.12);
}

.gallery-thumb :deep(.v-img) {
  width: 100%;
  height: 100%;
}

/* ===== Product Info ===== */
.product-info {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.product-sku {
  font-size: 0.8rem;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.35);
  letter-spacing: 0.04em;
  margin-bottom: 4px;
}

.product-title {
  font-size: 1.75rem;
  font-weight: 800;
  line-height: 1.3;
  color: rgb(var(--v-theme-on-surface));
  margin: 0;
}

.product-colors {
  margin-top: 8px;
}

.color-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 100px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.color-swatch {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
}

.color-name {
  font-size: 0.8rem;
  font-weight: 600;
}

/* ===== Meta Cards ===== */
.product-meta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.meta-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.04);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
}

.meta-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.meta-icon--success {
  background: rgba(var(--v-theme-success), 0.08);
  color: rgb(var(--v-theme-success));
}

.meta-icon--error {
  background: rgba(var(--v-theme-error), 0.08);
  color: rgb(var(--v-theme-error));
}

.meta-icon--info {
  background: rgba(var(--v-theme-info), 0.08);
  color: rgb(var(--v-theme-info));
}

.meta-label {
  font-size: 0.7rem;
  color: rgba(0, 0, 0, 0.4);
  margin-bottom: 2px;
}

.meta-value {
  font-size: 0.875rem;
  font-weight: 700;
}

/* ===== Fee Section ===== */
.fee-section {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
}

.fee-header {
  padding: 14px 18px;
  background: rgba(var(--v-theme-primary), 0.02);
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.fee-title {
  font-size: 0.85rem;
  font-weight: 700;
}

.fee-body {
  padding: 4px 0;
}

.fee-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 18px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
}

.fee-row:last-child {
  border-bottom: none;
}

.fee-key {
  font-size: 0.8rem;
  color: rgba(0, 0, 0, 0.45);
}

.fee-val {
  font-size: 0.85rem;
  font-weight: 600;
}

/* ===== Sell Button ===== */
.sell-button {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  height: 52px;
  border-radius: 14px !important;
  box-shadow: 0 4px 16px rgba(var(--v-theme-primary), 0.25);
  transition:
    box-shadow 0.2s ease,
    transform 0.15s ease;
}

.sell-button:hover {
  box-shadow: 0 6px 24px rgba(var(--v-theme-primary), 0.35);
  transform: translateY(-1px);
}

/* ===== Floating Sell Button ===== */
.floating-sell-btn {
  position: fixed !important;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  height: 52px !important;
  padding: 0 22px !important;
  border-radius: 100px !important;
  font-weight: 700;
  font-size: 0.9rem !important;
  letter-spacing: 0.01em;
  box-shadow:
    0 4px 20px rgba(var(--v-theme-primary), 0.4),
    0 0 0 4px rgba(var(--v-theme-primary), 0.08);
  transition:
    box-shadow 0.2s ease,
    transform 0.15s ease;
  animation: fab-enter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.floating-sell-btn:hover {
  box-shadow:
    0 6px 28px rgba(var(--v-theme-primary), 0.5),
    0 0 0 6px rgba(var(--v-theme-primary), 0.1);
  transform: translateX(-50%) translateY(-2px);
}

.floating-sell-btn--bounce {
  animation: fab-bounce 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes fab-enter {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(24px) scale(0.8);
  }
  100% {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}

@keyframes fab-bounce {
  0% {
    transform: translateX(-50%) scale(1);
  }
  30% {
    transform: translateX(-50%) scale(0.88);
  }
  60% {
    transform: translateX(-50%) scale(1.06);
  }
  100% {
    transform: translateX(-50%) scale(1);
  }
}

/* ===== Floating Cart Button ===== */
.floating-cart-btn {
  position: fixed !important;
  bottom: 28px;
  left: 28px;
  z-index: 101;
  width: 56px !important;
  height: 56px !important;
  border-radius: 50% !important;
  box-shadow:
    0 4px 24px rgba(var(--v-theme-secondary), 0.4),
    0 0 0 4px rgba(var(--v-theme-secondary), 0.1);
  transition:
    box-shadow 0.3s ease,
    transform 0.3s ease;
  animation: fab-enter-cart 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.floating-cart-btn:hover {
  box-shadow:
    0 6px 32px rgba(var(--v-theme-secondary), 0.5),
    0 0 0 6px rgba(var(--v-theme-secondary), 0.15);
  transform: scale(1.08);
}

.floating-cart-btn--pulse {
  animation: cart-pulse 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes cart-pulse {
  0% { transform: scale(1); }
  30% { transform: scale(1.3); }
  60% { transform: scale(0.9); }
  100% { transform: scale(1); }
}

@keyframes fab-enter-cart {
  0% {
    opacity: 0;
    transform: scale(0.3) translateY(20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes fab-enter-mobile {
  0% {
    opacity: 0;
    transform: translateY(24px) scale(0.8);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ===== Custom Toast ===== */
.toast-custom {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: 14px;
  background: #fff;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.06),
    0 0 0 1px rgba(0, 0, 0, 0.04);
  pointer-events: auto;
  white-space: nowrap;
  max-width: calc(100vw - 40px);
}

.toast-custom--success {
  border-right: 3px solid rgb(var(--v-theme-success));
}

.toast-custom--error {
  border-right: 3px solid rgb(var(--v-theme-error));
}

.toast-custom--warning {
  border-right: 3px solid rgb(var(--v-theme-warning));
}

.toast-custom--info {
  border-right: 3px solid rgb(var(--v-theme-info));
}

.toast-icon-wrapper {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.toast-custom--success .toast-icon-wrapper {
  background: rgba(var(--v-theme-success), 0.1);
  color: rgb(var(--v-theme-success));
}

.toast-custom--error .toast-icon-wrapper {
  background: rgba(var(--v-theme-error), 0.1);
  color: rgb(var(--v-theme-error));
}

.toast-custom--warning .toast-icon-wrapper {
  background: rgba(var(--v-theme-warning), 0.1);
  color: rgb(var(--v-theme-warning));
}

.toast-custom--info .toast-icon-wrapper {
  background: rgba(var(--v-theme-info), 0.1);
  color: rgb(var(--v-theme-info));
}

.toast-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.8);
}

.toast-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.04);
  color: rgba(0, 0, 0, 0.4);
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
  padding: 0;
}

.toast-close:hover {
  background: rgba(0, 0, 0, 0.08);
  color: rgba(0, 0, 0, 0.6);
}

.toast-slide-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-slide-leave-active {
  transition: all 0.25s ease-in;
}

.toast-slide-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px) scale(0.9);
}

.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px) scale(0.95);
}

@media (max-width: 599px) {
  .toast-custom {
    top: 12px;
    padding: 10px 16px;
    border-radius: 12px;
    max-width: calc(100vw - 24px);
  }

  .toast-text {
    font-size: 0.8rem;
  }
}

/* ===== Cart Items ===== */
.cart-items-scroll {
  max-height: 400px;
  overflow-y: auto;
}

.cart-item {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background 0.15s ease;
}

.cart-item:last-child {
  border-bottom: none;
}

.cart-item:hover {
  background: rgba(0, 0, 0, 0.015);
}

.cart-item-img-wrapper {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 12px;
  overflow: hidden;
}

.cart-item-thumb {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  background: #f5f5f5;
}

.cart-item-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
}

.cart-item-sku {
  font-size: 0.72rem;
  color: rgba(0, 0, 0, 0.35);
  margin-top: 1px;
}

.cart-item-details {
  flex-wrap: wrap;
}

.cart-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 8px;
  font-size: 0.72rem;
  font-weight: 600;
}

.cart-chip--fee {
  background: rgba(var(--v-theme-primary), 0.08);
  color: rgb(var(--v-theme-primary));
}

.cart-chip--weight {
  background: rgba(var(--v-theme-info), 0.08);
  color: rgb(var(--v-theme-info));
}

.cart-empty {
  min-height: 180px;
}

.cart-empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.03);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ===== Unavailable Banner ===== */
.unavailable-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.03);
  color: rgba(0, 0, 0, 0.4);
  font-size: 0.85rem;
  font-weight: 500;
}

/* ===== Dialogs ===== */
.dialog-card {
  border-radius: 20px !important;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 24px;
}

.dialog-header-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.08);
  color: rgb(var(--v-theme-primary));
  flex-shrink: 0;
}

.dialog-header-icon--warning {
  background: rgba(var(--v-theme-warning), 0.1);
  color: rgb(var(--v-theme-warning));
}

.dialog-header-icon--success {
  background: rgba(var(--v-theme-success), 0.1);
  color: rgb(var(--v-theme-success));
}

.dialog-header-icon--secondary {
  background: rgba(var(--v-theme-secondary), 0.1);
  color: rgb(var(--v-theme-secondary));
}

.dialog-title {
  font-size: 1.1rem;
  font-weight: 700;
}

.dialog-subtitle {
  font-size: 0.78rem;
  color: rgba(0, 0, 0, 0.4);
  margin-top: 2px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px !important;
}

/* ===== Customer Search ===== */
.customer-results {
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 14px;
  overflow: hidden;
  max-height: 260px;
  overflow-y: auto;
}

.customer-result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.15s ease;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
}

.customer-result-item:last-child {
  border-bottom: none;
}

.customer-result-item:hover {
  background: rgba(var(--v-theme-primary), 0.04);
}

.selected-customer {
  background: rgba(var(--v-theme-primary), 0.04);
  border: 1px solid rgba(var(--v-theme-primary), 0.12);
  border-radius: 14px;
  padding: 12px 14px;
}

/* ===== Preview ===== */
.preview-overlay {
  background: rgba(0, 0, 0, 0.85) !important;
  box-shadow: none !important;
  backdrop-filter: blur(8px);
}

.preview-box {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  max-height: 90vh;
}

.preview-img {
  max-height: 85vh;
  max-width: 90vw;
  object-fit: contain;
  border-radius: 8px;
}

.preview-close {
  position: absolute !important;
  top: -48px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  background: rgba(255, 255, 255, 0.12) !important;
  backdrop-filter: blur(8px);
  border-radius: 50% !important;
  transition: all 0.2s ease !important;
}

.preview-close:hover {
  background: rgba(255, 255, 255, 0.25) !important;
  transform: translateX(-50%) scale(1.1);
}

/* ===== Transitions ===== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ===== Responsive ===== */
@media (max-width: 959px) {
  .variant-page-inner {
    padding: 20px 16px 100px;
  }

  .sell-button {
    display: none !important;
  }

  .product-layout {
    grid-template-columns: 1fr;
    gap: 28px;
  }

  .product-gallery {
    position: static;
  }

  .gallery-main {
    border-radius: 16px;
  }

  .product-title {
    font-size: 1.5rem;
  }

  .product-meta {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .meta-card {
    flex-direction: column;
    text-align: center;
    padding: 12px 8px;
    gap: 8px;
  }

  .meta-icon {
    width: 36px;
    height: 36px;
  }

  .meta-label {
    font-size: 0.65rem;
  }

  .meta-value {
    font-size: 0.8rem;
  }

  .floating-sell-btn {
    bottom: 28px;
    left: 50%;
    transform: translateX(-50%);
    animation: fab-enter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }

  .floating-sell-btn:hover {
    transform: translateX(-50%) translateY(-2px);
  }

  .floating-cart-btn {
    bottom: 28px;
    left: 28px;
    width: 50px !important;
    height: 50px !important;
  }
}

@media (max-width: 599px) {
  .variant-page-inner {
    padding: 16px 12px 100px;
  }

  .sell-button {
    display: none !important;
  }

  .product-layout {
    gap: 20px;
  }

  .gallery-main {
    border-radius: 14px;
  }

  .gallery-thumb {
    width: 60px;
    height: 60px;
  }

  .product-title {
    font-size: 1.3rem;
  }

  .product-meta {
    grid-template-columns: 1fr 1fr 1fr;
    gap: 6px;
  }

  .meta-card {
    padding: 10px 6px;
    border-radius: 12px;
  }

  .meta-icon {
    width: 32px;
    height: 32px;
    border-radius: 10px;
  }

  .meta-icon .v-icon {
    font-size: 18px !important;
  }

  .meta-label {
    font-size: 0.6rem;
  }

  .meta-value {
    font-size: 0.75rem;
  }

  .fee-section {
    border-radius: 14px;
  }

  .fee-row {
    padding: 9px 14px;
  }

  .sell-button {
    height: 48px;
    border-radius: 12px !important;
    font-size: 0.95rem;
  }

  .floating-sell-btn {
    bottom: 28px;
    left: 50%;
    transform: translateX(-50%);
    height: 48px !important;
    font-size: 0.82rem !important;
    padding: 0 18px !important;
    animation: fab-enter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }

  .floating-sell-btn:hover {
    transform: translateX(-50%) translateY(-2px);
  }

  .floating-cart-btn {
    bottom: 28px;
    left: 20px;
    width: 48px !important;
    height: 48px !important;
  }

  .dialog-header {
    padding: 16px 20px;
  }

  .dialog-actions {
    padding: 12px 20px !important;
  }

  .cart-item {
    padding: 14px 16px;
  }
}
</style>

<script setup>
import { useRouter } from 'vue-router'
import { fetchAdminOrders } from '@/services/orders'
import { fetchProductCategories, fetchProducts } from '@/services/products'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const router = useRouter()
const searchInputRef = ref(null)

const query = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const dataLoaded = ref(false)

const orders = ref([])
const products = ref([])
const categories = ref([])

const normalize = value => `${value ?? ''}`.toLowerCase().trim()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

async function loadSearchData() {
  if (dataLoaded.value || isLoading.value)
    return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const [ordersResponse, productsResponse, categoriesResponse] = await Promise.allSettled([
      fetchAdminOrders(),
      fetchProducts(),
      fetchProductCategories(),
    ])

    orders.value = ordersResponse.status === 'fulfilled' && Array.isArray(ordersResponse.value)
      ? ordersResponse.value
      : []
    products.value = productsResponse.status === 'fulfilled' && Array.isArray(productsResponse.value)
      ? productsResponse.value
      : []
    categories.value = categoriesResponse.status === 'fulfilled' && Array.isArray(categoriesResponse.value)
      ? categoriesResponse.value
      : []

    dataLoaded.value = true

    const failedRequests = [ordersResponse, productsResponse, categoriesResponse].some(result => result.status === 'rejected')
    if (failedRequests) {
      errorMessage.value = 'Some data failed to load, but search continues on available data.'
    }
  }
  catch (error) {
    errorMessage.value = error?.response?.data?.detail || 'Failed to load search data.'
  }
  finally {
    isLoading.value = false
  }
}

function closeDialog() {
  open.value = false
  query.value = ''
  errorMessage.value = ''
}

async function openRoute(route) {
  closeDialog()
  await router.push(route)
}

const orderResults = computed(() => {
  const searchTerm = normalize(query.value)
  if (!searchTerm)
    return []

  return orders.value
    .filter((order) => {
      const haystack = [
        order.order_number,
        order.id,
        order.customer_name,
        order.customer_phone,
        order.status,
      ].map(normalize).join(' ')

      return haystack.includes(searchTerm)
    })
    .slice(0, 5)
    .map(order => ({
      id: `order-${order.id}`,
      type: 'Order',
      title: order.order_number || `Order ${order.id}`,
      subtitle: [order.customer_name, order.customer_phone].filter(Boolean).join(' · ') || 'No customer info',
      route: '/orders',
    }))
})

const productResults = computed(() => {
  const searchTerm = normalize(query.value)
  if (!searchTerm)
    return []

  return products.value
    .filter((product) => {
      const categoryName = product.category?.name || categories.value.find(category => category.id === product.category)?.name || ''

      const haystack = [
        product.name,
        product.slug,
        categoryName,
      ].map(normalize).join(' ')

      return haystack.includes(searchTerm)
    })
    .slice(0, 5)
    .map(product => ({
      id: `product-${product.id}`,
      type: 'Product',
      title: product.name || product.slug || `Product ${product.id}`,
      subtitle: product.slug || product.category?.name || 'No additional info',
      route: '/products',
    }))
})

const categoryResults = computed(() => {
  const searchTerm = normalize(query.value)
  if (!searchTerm)
    return []

  return categories.value
    .filter((category) => {
      const haystack = [category.name, category.slug].map(normalize).join(' ')

      return haystack.includes(searchTerm)
    })
    .slice(0, 5)
    .map(category => ({
      id: `category-${category.id}`,
      type: 'Category',
      title: category.name || category.slug || `Category ${category.id}`,
      subtitle: category.slug || 'No slug',
      route: '/product-categories',
    }))
})

const searchResults = computed(() => [
  ...orderResults.value,
  ...productResults.value,
  ...categoryResults.value,
])

watch(open, async (value) => {
  if (!value)
    return

  await loadSearchData()
  await nextTick()
  searchInputRef.value?.focus?.()
})
</script>

<template>
  <VDialog
    v-model="open"
    max-width="760"
    scrollable
  >
    <VCard class="pa-2">
      <VCardTitle class="d-flex align-center justify-space-between gap-4">
        <div>
          <div class="text-h6">
            Search
          </div>
          <div class="text-body-2 text-medium-emphasis">
            Search orders, products, and categories with available data.
          </div>
        </div>

        <VBtn
          icon="bx-x"
          variant="text"
          @click="closeDialog"
        />
      </VCardTitle>

      <VDivider />

      <VCardText>
        <VTextField
          ref="searchInputRef"
          v-model="query"
          v-persian-convert
          prepend-inner-icon="bx-search"
          label="Search"
          placeholder="e.g. order number, customer name, product name, or category"
          autofocus
          hide-details
          clearable
          @click:clear="query = ''"
        />

        <VAlert
          v-if="errorMessage"
          type="warning"
          variant="tonal"
          class="mt-4"
        >
          {{ errorMessage }}
        </VAlert>

        <div
          v-if="isLoading"
          class="d-flex justify-center py-6"
        >
          <VProgressCircular
            indeterminate
            color="primary"
          />
        </div>

        <div
          v-else-if="!normalize(query)"
          class="text-center text-medium-emphasis py-8"
        >
          Enter a search term to see results.
        </div>

        <div
          v-else-if="searchResults.length === 0"
          class="text-center text-medium-emphasis py-8"
        >
          No results found for this search.
        </div>

        <VList
          v-else
          class="mt-4"
        >
          <template
            v-for="result in searchResults"
            :key="result.id"
          >
            <VListItem
              link
              @click="openRoute(result.route)"
            >
              <template #prepend>
                <VAvatar
                  size="36"
                  color="primary"
                  variant="tonal"
                >
                  {{ result.type.charAt(0) }}
                </VAvatar>
              </template>

              <VListItemTitle>
                {{ result.title }}
              </VListItemTitle>

              <VListItemSubtitle>
                {{ result.type }} · {{ result.subtitle }}
              </VListItemSubtitle>
            </VListItem>

            <VDivider />
          </template>
        </VList>
      </VCardText>
    </VCard>
  </VDialog>
</template>

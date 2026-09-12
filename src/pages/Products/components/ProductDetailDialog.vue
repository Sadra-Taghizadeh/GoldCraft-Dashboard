<script setup>
import { fetchProductDetail, fetchProductVariantQR } from '@/services/products'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  slug: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const isLoading = ref(false)
const errorMessage = ref('')
const product = ref(null)

const formatDate = value => value || '—'

async function loadProduct() {
  if (!props.slug)
    return

  isLoading.value = true
  errorMessage.value = ''

  try {
    product.value = await fetchProductDetail(props.slug)
  }
  catch (error) {
    product.value = null
    errorMessage.value = error?.response?.data?.detail || 'Unable to load product details.'
  }
  finally {
    isLoading.value = false
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      loadProduct()
    }
    else {
      errorMessage.value = ''
    }
  },
)

watch(
  () => props.slug,
  () => {
    if (props.modelValue) {
      loadProduct()
    }
  },
)

const qrDialogOpen = ref(false)
const qrImageUrl = ref('')
const qrLoading = ref(false)
const qrObjectUrl = ref('')

async function showVariantQR(variantId) {
  qrLoading.value = true
  qrDialogOpen.value = true
  if (qrObjectUrl.value) {
    URL.revokeObjectURL(qrObjectUrl.value)
    qrObjectUrl.value = ''
  }
  qrImageUrl.value = ''
  try {
    const blob = await fetchProductVariantQR(variantId)

    qrObjectUrl.value = URL.createObjectURL(blob)
    qrImageUrl.value = qrObjectUrl.value
  }
  catch {
    qrImageUrl.value = ''
  }
  finally {
    qrLoading.value = false
  }
}

function downloadQR() {
  if (!qrImageUrl.value)
    return
  const a = document.createElement('a')

  a.href = qrImageUrl.value
  a.download = 'qr-code.png'
  a.click()
}

const imageViewerOpen = ref(false)
const imageViewerImages = ref([])
const imageViewerIndex = ref(0)

function openImageViewer(images, index) {
  if (!images?.length)
    return
  imageViewerImages.value = images
  imageViewerIndex.value = index
  imageViewerOpen.value = true
}

function prevImage() {
  if (imageViewerIndex.value > 0)
    imageViewerIndex.value--
}

function nextImage() {
  if (imageViewerIndex.value < imageViewerImages.value.length - 1)
    imageViewerIndex.value++
}

onBeforeUnmount(() => {
  if (qrObjectUrl.value)
    URL.revokeObjectURL(qrObjectUrl.value)
})
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="900"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between gap-4 flex-wrap">
        <div>
          <div class="text-h6">
            Product Details
          </div>
          <div class="text-body-2 text-medium-emphasis">
            {{ product?.name || '—' }}
          </div>
        </div>
        <div class="d-flex gap-2">
          <VChip
            v-if="product"
            size="small"
            :color="product.is_active ? 'success' : 'secondary'"
            variant="tonal"
          >
            {{ product.is_active ? 'Active' : 'Inactive' }}
          </VChip>
          <VChip
            v-if="product"
            size="small"
            :color="product.is_featured ? 'warning' : 'default'"
            variant="tonal"
          >
            {{ product.is_featured ? 'Featured' : 'Regular' }}
          </VChip>
        </div>
      </VCardTitle>

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
          v-if="isLoading"
          class="d-flex justify-center py-8"
        >
          <VProgressCircular
            indeterminate
            color="primary"
          />
        </div>

        <template v-else-if="product">
          <section class="rounded-xl border border-[rgba(var(--v-theme-primary),0.14)] bg-[linear-gradient(180deg,rgba(var(--v-theme-surface),0.98),rgba(var(--v-theme-primary),0.02))] p-4 shadow-sm">
            <div class="text-sm font-semibold text-[rgb(var(--v-theme-on-surface))] mb-3">
              Product Basic Information
            </div>

            <div class="d-flex flex-column flex-sm-row gap-4 mb-4">
              <div
                class="d-flex align-center justify-center overflow-hidden rounded-xl border border-[rgba(var(--v-theme-primary),0.16)] bg-[linear-gradient(135deg,rgba(var(--v-theme-primary),0.08),rgba(var(--v-theme-primary),0.03))] cursor-pointer transition-shadow hover:shadow-md shrink-0 align-self-start"
                style="width: 120px; height: 120px;"
                @click="product.primary_image && openImageViewer([{ image: product.primary_image, alt_text: product.name }], 0)"
              >
                <img
                  v-if="product.primary_image"
                  :src="product.primary_image"
                  alt="Product primary image"
                  class="w-100 h-100 object-cover"
                >
                <span
                  v-else
                  class="text-body-2 text-medium-emphasis"
                >No Image</span>
              </div>

              <div class="flex-grow-1 min-w-0">
                <div class="d-flex align-center gap-2 flex-wrap mb-2">
                  <span class="text-h6 font-weight-bold text-[rgb(var(--v-theme-on-surface))]">
                    {{ product.name || '—' }}
                  </span>
                  <VChip size="x-small" :color="product.is_active ? 'success' : 'secondary'" variant="tonal">
                    {{ product.is_active ? 'Active' : 'Inactive' }}
                  </VChip>
                  <VChip v-if="product.is_featured" size="x-small" color="warning" variant="tonal">
                    Featured
                  </VChip>
                </div>

                <div class="d-flex flex-column gap-1 text-xs text-medium-emphasis">
                  <div class="d-flex gap-4 flex-wrap">
                    <span>Slug: <span class="font-semibold text-[rgb(var(--v-theme-on-surface))]">{{ product.slug || '—' }}</span></span>
                    <span>Category: <span class="font-semibold text-[rgb(var(--v-theme-on-surface))]">{{ product.category?.name || '—' }}</span></span>
                  </div>
                  <div class="d-flex gap-4 flex-wrap">
                    <span>Total Stock: <span class="font-semibold text-[rgb(var(--v-theme-on-surface))]">{{ product.total_quantity ?? '—' }}</span></span>
                    <span>{{ product.available ? 'Available' : 'Unavailable' }}</span>
                    <span>Favorite: <span class="font-semibold text-[rgb(var(--v-theme-on-surface))]">{{ product.is_favorite ? 'Yes' : 'No' }}</span></span>
                  </div>
                </div>

                <div
                  v-if="product.description"
                  class="text-xs text-medium-emphasis mt-2 line-clamp-3"
                  style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;"
                >
                  {{ product.description }}
                </div>

                <div class="d-flex gap-4 text-xs text-medium-emphasis mt-2">
                  <span>Created: {{ formatDate(product.created_at) }}</span>
                  <span>Updated: {{ formatDate(product.updated_at) }}</span>
                </div>
              </div>
            </div>

            <template v-if="product.product_fee_profile">
              <VDivider class="mb-4" />

              <div class="mb-3 d-flex align-center justify-between gap-3 flex-wrap">
                <div>
                  <div class="text-sm font-semibold text-[rgb(var(--v-theme-on-surface))]">
                    Commission Profile
                  </div>
                  <div class="text-xs text-medium-emphasis">
                    Default commission settings for all variants
                  </div>
                </div>
                <div class="d-flex gap-1">
                  <VChip size="x-small" :color="product.product_fee_profile.fee_type === 'fixed' ? 'info' : 'primary'" variant="tonal">
                    {{ product.product_fee_profile.fee_type === 'fixed' ? 'Fixed Amount' : 'Percent' }}
                  </VChip>
                  <VChip size="x-small" :color="product.product_fee_profile.is_active ? 'success' : 'secondary'" variant="tonal">
                    {{ product.product_fee_profile.is_active ? 'Active' : 'Inactive' }}
                  </VChip>
                </div>
              </div>

              <div class="d-flex gap-4 flex-wrap text-xs mb-4">
                <div>
                  <span class="text-medium-emphasis">Base Commission:</span>
                  <span class="font-semibold">{{ product.product_fee_profile.base_fee || '—' }}{{ product.product_fee_profile.fee_type === 'percent' ? '%' : '' }}</span>
                </div>
                <div>
                  <span class="text-medium-emphasis">Base Weight:</span>
                  <span class="font-semibold">{{ product.product_fee_profile.base_weight || '—' }} g</span>
                </div>
                <div>
                  <span class="text-medium-emphasis">Base Quantity:</span>
                  <span class="font-semibold">{{ product.product_fee_profile.base_quantity ?? '—' }}</span>
                </div>
              </div>

              <template v-if="product.product_fee_profile.weight_overrides?.length">
                <div class="rounded-xl border border-[rgba(var(--v-theme-primary),0.1)] bg-white/70 p-3 mb-3">
                  <div class="text-xs font-semibold mb-2">Weight Table</div>
                  <div dir="ltr" class="grid grid-cols-2 gap-2 lg:grid-cols-5">
                    <div
                      v-for="(wo, woIndex) in product.product_fee_profile.weight_overrides"
                      :key="wo.id"
                      class="text-center rounded-xl border border-[rgba(var(--v-theme-primary),0.08)] bg-[rgba(var(--v-theme-primary),0.02)] p-2"
                    >
                      <div class="text-[10px] text-medium-emphasis mb-1 whitespace-nowrap">
                        {{ Number(wo.multiplier).toFixed(2) }}x
                      </div>
                      <div class="text-xs text-medium-emphasis mb-1">
                        {{ wo.weight_gram }} g
                      </div>
                      <div class="text-sm font-semibold text-[rgb(var(--v-theme-on-surface))]">
                        {{ wo.fee_value || '—' }}{{ product.product_fee_profile.fee_type === 'percent' ? '%' : '' }}
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <template v-if="product.product_fee_profile.quantity_tiers?.length">
                <div class="rounded-xl border border-[rgba(var(--v-theme-primary),0.1)] bg-white/70 p-3">
                  <div class="text-xs font-semibold mb-2">Quantity Table</div>
                  <div dir="ltr" class="grid grid-cols-2 gap-2 lg:grid-cols-5">
                    <div
                      v-for="tier in product.product_fee_profile.quantity_tiers"
                      :key="tier.id"
                      class="text-center rounded-xl border border-[rgba(var(--v-theme-primary),0.08)] bg-[rgba(var(--v-theme-primary),0.02)] p-2"
                    >
                      <div class="text-[10px] text-medium-emphasis mb-1">
                        {{ tier.min_quantity }}
                      </div>
                      <div class="text-sm font-semibold text-[rgb(var(--v-theme-on-surface))]">
                        {{ tier.fee_value || '—' }}{{ product.product_fee_profile.fee_type === 'percent' ? '%' : '' }}
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </template>
          </section>

          <div class="mt-4">
            <div class="text-subtitle-1 font-weight-semibold mb-3 d-flex align-center gap-2">
              <span>Stock</span>
              <VChip
                v-if="product.variants?.length"
                size="x-small"
                color="primary"
                variant="tonal"
              >
                {{ product.variants.length }}
              </VChip>
            </div>

            <div
              v-if="!product.variants || product.variants.length === 0"
              class="text-center text-medium-emphasis py-4 rounded-xl border border-[rgba(var(--v-theme-primary),0.1)]"
            >
              No variants to display.
            </div>

            <div class="d-flex flex-column gap-2">
              <div
                v-for="variant in product.variants || []"
                :key="variant.id"
                class="rounded-xl border border-[rgba(var(--v-theme-primary),0.1)] bg-white/50 overflow-hidden"
              >
                <div class="d-flex align-center pa-3 gap-3">
                  <div
                    v-if="variant.images?.length"
                    class="position-relative shrink-0 cursor-pointer rounded-lg overflow-hidden"
                    style="width: 56px; height: 56px;"
                    @click="openImageViewer(variant.images, 0)"
                  >
                    <img
                      :src="variant.images.find(i => i.is_primary)?.image || variant.images[0].image"
                      class="w-full h-full object-cover"
                    >
                    <div
                      v-if="variant.images.length > 1"
                      class="position-absolute d-flex align-center justify-center rounded-sm bg-black/60 text-white font-weight-bold"
                      style="bottom: 0; left: 0; right: 0; padding: 1px 0; font-size: 0.55rem;"
                    >
                      {{ variant.images.length }}+
                    </div>
                  </div>
                  <div
                    v-else
                    class="d-flex align-center justify-center rounded-lg bg-[rgba(var(--v-theme-primary),0.04)]"
                    style="width: 56px; height: 56px;"
                  >
                    <VIcon icon="bx-image" size="20" class="text-medium-emphasis" />
                  </div>

                  <div class="min-w-0 flex-grow-1">
                    <div class="d-flex align-center gap-2 flex-wrap">
                      <span class="text-sm font-semibold text-[rgb(var(--v-theme-on-surface))]">
                        {{ variant.sku || '—' }}
                      </span>
                      <VChip v-if="variant.is_primary" size="x-small" color="primary" variant="tonal">Primary</VChip>
                      <VChip size="x-small" :color="variant.is_active ? 'success' : 'secondary'" variant="tonal">
                        {{ variant.is_active ? 'Active' : 'Inactive' }}
                      </VChip>
                      <VChip v-if="variant.has_commission" size="x-small" color="info" variant="tonal">Commission</VChip>
                    </div>
                  </div>

                  <div class="d-flex align-center gap-4 text-xs text-medium-emphasis shrink-0">
                    <div v-if="variant.fee != null && variant.fee !== ''" class="text-center">
                      <div class="text-[10px]">Commission</div>
                      <div class="font-semibold text-[rgb(var(--v-theme-on-surface))]">{{ variant.fee }} {{ variant.fee_type === 'fixed' ? 'IRR' : '%' }}</div>
                    </div>
                    <div class="text-center">
                      <div class="text-[10px]">Weight</div>
                      <div class="font-semibold text-[rgb(var(--v-theme-on-surface))]">{{ variant.weight ?? '—' }}g</div>
                    </div>
                    <div v-if="variant.colors?.length" class="d-flex align-center gap-1">
                      <span
                        v-for="color in variant.colors"
                        :key="color.id"
                        class="rounded-circle shrink-0"
                        style="width: 14px; height: 14px; border: 2px solid white; box-shadow: 0 0 0 1px rgba(0,0,0,0.1);"
                        :style="{ backgroundColor: color.code || 'transparent' }"
                        :title="color.name"
                      />
                    </div>
                  </div>

                  <VBtn
                    icon
                    size="x-small"
                    variant="text"
                    color="primary"
                    title="QR Code"
                    class="shrink-0"
                    @click="showVariantQR(variant.id)"
                  >
                    <VIcon icon="bx-qr" size="18" />
                  </VBtn>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="product.faqs?.length"
            class="mt-4"
          >
            <div class="text-subtitle-1 font-weight-semibold mb-3 d-flex align-center gap-2">
              <span>FAQs</span>
              <VChip
                size="x-small"
                color="primary"
                variant="tonal"
              >
                {{ product.faqs.length }}
              </VChip>
            </div>

            <div
              v-for="faq in product.faqs"
              :key="faq.id"
              class="mb-2 rounded-lg border border-[rgba(var(--v-theme-primary),0.1)] bg-white/70 p-3"
            >
              <div class="text-sm font-semibold text-[rgb(var(--v-theme-on-surface))] mb-1">
                {{ faq.question }}
              </div>
              <div class="text-xs text-medium-emphasis">
                {{ faq.answer }}
              </div>
              <div class="text-xs text-medium-emphasis mt-1">
                Display Order: {{ faq.display_order }}
              </div>
            </div>
          </div>
        </template>
      </VCardText>

      <VDivider />

      <VCardActions class="justify-end">
        <VBtn
          color="primary"
          variant="tonal"
          @click="emit('update:modelValue', false)"
        >
          Close
        </VBtn>
      </VCardActions>
    </VCard>

    <!-- QR Code Dialog -->
    <VDialog v-model="qrDialogOpen" max-width="360">
      <VCard>
        <VCardTitle class="d-flex align-center justify-space-between text-body-1 pa-4">
          <span>Variant QR Code</span>
          <VBtn icon size="small" variant="text" @click="qrDialogOpen = false">
            <VIcon icon="bx-x" />
          </VBtn>
        </VCardTitle>
        <VDivider />
        <VCardText class="d-flex flex-column align-center pa-6">
          <div v-if="qrLoading" class="py-6">
            <VProgressCircular indeterminate color="primary" width="3" size="40" />
          </div>
          <template v-else-if="qrImageUrl">
            <img :src="qrImageUrl" class="rounded-lg border mb-4" style="max-width: 240px; width: 100%;">
            <VBtn block variant="tonal" color="primary" prepend-icon="bx-download" @click="downloadQR">
              Download
            </VBtn>
          </template>
          <div v-else class="text-medium-emphasis text-body-2 py-4">
            Unable to retrieve QR code.
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Image Viewer Overlay -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="imageViewerOpen"
          class="image-viewer-overlay"
          @click.self="imageViewerOpen = false"
        >
          <VBtn
            icon
            size="small"
            variant="text"
            color="white"
            class="image-viewer-close"
            @click="imageViewerOpen = false"
          >
            <VIcon icon="bx-x" size="24" />
          </VBtn>

          <VBtn
            v-if="imageViewerImages.length > 1"
            icon
            size="small"
            variant="text"
            color="white"
            class="image-viewer-nav"
            style="right: 16px;"
            :disabled="imageViewerIndex === imageViewerImages.length - 1"
            @click="nextImage"
          >
            <VIcon icon="bx-chevron-left" size="28" />
          </VBtn>

          <img
            v-if="imageViewerImages[imageViewerIndex]"
            :src="imageViewerImages[imageViewerIndex].image"
            :alt="imageViewerImages[imageViewerIndex].alt_text || 'Product image'"
            class="image-viewer-img"
          >

          <VBtn
            v-if="imageViewerImages.length > 1"
            icon
            size="small"
            variant="text"
            color="white"
            class="image-viewer-nav"
            style="left: 16px;"
            :disabled="imageViewerIndex === 0"
            @click="prevImage"
          >
            <VIcon icon="bx-chevron-right" size="28" />
          </VBtn>

          <div
            v-if="imageViewerImages.length > 1"
            class="image-viewer-counter"
          >
            {{ imageViewerIndex + 1 }} / {{ imageViewerImages.length }}
          </div>
        </div>
      </Transition>
    </Teleport>
  </VDialog>
</template>

<style scoped>
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

.image-viewer-nav {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  background: rgba(255, 255, 255, 0.1) !important;
  border-radius: 50%;
}

.image-viewer-nav:hover {
  background: rgba(255, 255, 255, 0.2) !important;
}

.image-viewer-counter {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  user-select: none;
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

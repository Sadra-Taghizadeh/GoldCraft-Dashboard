<script setup>
import { fetchProductDetail, fetchProductVariantQR } from '@/services/products'

const props = defineProps({
  slug: {
    type: String,
    default: '',
  },
})

const dialogModel = defineModel({ type: Boolean, default: false })

const product = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')

const qrDialogOpen = ref(false)
const qrImageUrl = ref('')
const qrLoading = ref(false)
const qrObjectUrl = ref('')
const selectedVariant = ref(null)

const previewDialogOpen = ref(false)
const previewImageUrl = ref('')
const previewLoading = ref(false)

const MEDIA_BASE_URL = 'http://belluccidesign.gold'

function fullImageUrl(url) {
  if (!url)
    return ''

  return url.startsWith('http') ? url : `${MEDIA_BASE_URL}${url}`
}

function getPrimaryImage(variant) {
  if (!variant.images?.length)
    return null
  const primary = variant.images.find(img => img.is_primary)
  const img = primary || variant.images[0]
  if (!img?.image)
    return null

  return fullImageUrl(img.image)
}

watch(dialogModel, async (open) => {
  if (open && props.slug) {
    isLoading.value = true
    errorMessage.value = ''
    product.value = null
    try {
      product.value = await fetchProductDetail(props.slug)
    }
    catch (error) {
      errorMessage.value = error?.response?.data?.detail || 'Unable to load variants.'
    }
    finally {
      isLoading.value = false
    }
  }
})

async function showVariantQR(variant) {
  selectedVariant.value = variant
  qrLoading.value = true
  qrDialogOpen.value = true
  if (qrObjectUrl.value) {
    URL.revokeObjectURL(qrObjectUrl.value)
    qrObjectUrl.value = ''
  }
  qrImageUrl.value = ''
  try {
    const blob = await fetchProductVariantQR(variant.id)

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
  a.download = `qr-${selectedVariant.value?.sku || 'variant'}.png`
  a.click()
}

onBeforeUnmount(() => {
  if (qrObjectUrl.value)
    URL.revokeObjectURL(qrObjectUrl.value)
})
</script>

<template>
  <VDialog
    v-model="dialogModel"
    max-width="900"
    scrollable
  >
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between gap-4 flex-wrap pa-5">
        <div class="d-flex align-center gap-3">
          <VAvatar
            color="info"
            variant="tonal"
            size="44"
          >
            <VIcon
              icon="bx-package"
              size="22"
            />
          </VAvatar>
          <div>
            <div class="text-h6">
              Product Variants
            </div>
            <div
              v-if="product"
              class="text-caption text-medium-emphasis"
            >
              {{ product.name }}
            </div>
          </div>
        </div>
        <VChip
          v-if="product?.variants?.length"
          size="small"
          color="primary"
          variant="tonal"
        >
          {{ product.variants.length }} Variants
        </VChip>
      </VCardTitle>

      <VDivider />

      <VCardText>
        <div
          v-if="isLoading"
          class="d-flex justify-center py-8"
        >
          <VProgressCircular
            indeterminate
            color="primary"
          />
        </div>

        <VAlert
          v-else-if="errorMessage"
          type="error"
          variant="tonal"
        >
          {{ errorMessage }}
        </VAlert>

        <template v-else-if="product">
          <div
            v-if="!product.variants?.length"
            class="text-center text-medium-emphasis py-8"
          >
            No variants available for this product.
          </div>

          <div
            v-for="variant in product.variants"
            :key="variant.id"
            class="variant-row mb-3 rounded-xl border border-[rgba(var(--v-theme-primary),0.14)] bg-[linear-gradient(180deg,rgba(var(--v-theme-surface),0.98),rgba(var(--v-theme-primary),0.02))] p-4 shadow-sm"
          >
            <div class="d-flex align-start justify-between gap-3">
              <div class="d-flex align-center gap-3">
                <div
                  class="variant-thumb"
                  title="View image"
                  @click="previewImageUrl = getPrimaryImage(variant); previewLoading = true; previewDialogOpen = true"
                >
                  <template v-if="getPrimaryImage(variant)">
                    <VImg
                      :src="getPrimaryImage(variant)"
                      class="variant-thumb-img"
                      cover
                      eager
                    />
                    <div class="variant-thumb-overlay">
                      <VIcon
                        icon="bx-search"
                        size="14"
                      />
                    </div>
                  </template>
                  <div
                    v-else
                    class="variant-thumb-placeholder"
                  >
                    <VIcon
                      icon="bx-image"
                      size="16"
                      color="disabled"
                    />
                  </div>
                </div>
                <div>
                  <div class="text-sm font-semibold">
                    {{ variant.product_name || '—' }}
                  </div>
                  <div class="text-xs text-medium-emphasis">
                    SKU: <code>{{ variant.sku || '—' }}</code>
                  </div>
                  <div class="text-xs mt-1">
                    <span class="text-medium-emphasis">Fee:</span>
                    <span class="font-semibold">{{ variant.fee ?? '—' }} {{ variant.fee_type === 'fixed' ? 'IRR' : '%' }}</span>
                    <span class="text-medium-emphasis ms-3">Weight:</span>
                    <span class="font-semibold">{{ variant.weight ?? '—' }} g</span>
                  </div>
                </div>
              </div>
              <div class="d-flex gap-1 flex-wrap justify-end align-center">
                <VBtn
                  icon
                  size="x-small"
                  variant="text"
                  color="primary"
                  title="QR Code"
                  @click="showVariantQR(variant)"
                >
                  <VIcon icon="bx-qr" size="18" />
                </VBtn>
                <!-- <VChip
                  size="x-small"
                  :color="variant.available ? 'success' : 'error'"
                  variant="tonal"
                >
                  {{ variant.available ? 'Available' : 'Unavailable' }}
                </VChip> -->
                <VChip
                  v-if="variant.is_primary"
                  size="x-small"
                  color="primary"
                  variant="tonal"
                >
                  Primary
                </VChip>
                <VChip
                  size="x-small"
                  :color="variant.is_active ? 'success' : 'secondary'"
                  variant="tonal"
                >
                  {{ variant.is_active ? 'Active' : 'Inactive' }}
                </VChip>
                <VChip
                  v-if="variant.has_commission"
                  size="x-small"
                  color="info"
                  variant="tonal"
                >
                  Commission
                </VChip>
              </div>
            </div>

            <VRow
              v-if="variant.colors?.length || variant.images?.length"
              class="mt-3"
            >
              <VCol
                v-if="variant.colors?.length"
                cols="12"
                md="6"
              >
                <div class="text-xs text-medium-emphasis mb-1">
                  Colors
                </div>
                <div class="d-flex gap-1 flex-wrap">
                  <div
                    v-for="color in variant.colors"
                    :key="color.id"
                    class="d-flex align-center gap-1 rounded-md border px-2 py-1"
                  >
                    <span
                      class="color-dot"
                      :style="{ backgroundColor: color.code }"
                    />
                    <span class="text-xs">{{ color.name }}</span>
                  </div>
                </div>
              </VCol>
              <VCol
                v-if="variant.images?.length"
                cols="12"
                md="6"
              >
                <div class="text-xs text-medium-emphasis mb-1">
                  Images
                </div>
                <div class="d-flex gap-2 flex-wrap">
                  <div
                    v-for="img in variant.images"
                    :key="img.id"
                    class="position-relative"
                  >
                    <img
                      :src="fullImageUrl(img.image)"
                      :alt="img.alt_text || 'Variant image'"
                      class="h-14 w-14 rounded-lg border object-cover"
                    >
                    <div
                      v-if="img.is_primary"
                      class="position-absolute d-flex align-center justify-center text-white text-xs font-weight-bold px-1 rounded-pill"
                      style="bottom: 2px; right: 2px; background: rgb(var(--v-theme-primary)); line-height: 1.4; font-size: 0.55rem;"
                    >
                      Primary
                    </div>
                  </div>
                </div>
              </VCol>
            </VRow>
          </div>
        </template>
      </VCardText>

      <VDivider />

      <VCardActions class="justify-end pa-5">
        <VBtn
          variant="outlined"
          size="large"
          @click="dialogModel = false"
        >
          Close
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- QR Code Dialog -->
  <VDialog
    v-model="qrDialogOpen"
    max-width="360"
  >
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between text-body-1 pa-4">
        <span>Variant QR Code</span>
        <VBtn
          icon
          size="small"
          variant="text"
          @click="qrDialogOpen = false"
        >
          <VIcon icon="bx-x" />
        </VBtn>
      </VCardTitle>
      <VDivider />
      <VCardText class="d-flex flex-column align-center pa-6">
        <div
          v-if="qrLoading"
          class="py-6"
        >
          <VProgressCircular
            indeterminate
            color="primary"
            width="3"
            size="40"
          />
        </div>
        <template v-else-if="qrImageUrl">
          <img
            :src="qrImageUrl"
            class="rounded-lg border mb-4"
            style="max-width: 240px; width: 100%;"
          >
          <div
            v-if="selectedVariant?.sku"
            class="text-center text-body-2 mb-3"
          >
            {{ selectedVariant.sku }}
          </div>
          <VBtn
            block
            variant="tonal"
            color="primary"
            prepend-icon="bx-download"
            @click="downloadQR"
          >
            Download
          </VBtn>
        </template>
        <div
          v-else
          class="text-medium-emphasis text-body-2 py-4"
        >
          Unable to retrieve QR code.
        </div>
      </VCardText>
    </VCard>
  </VDialog>

  <!-- Image Preview Dialog -->
  <VDialog
    v-model="previewDialogOpen"
    max-width="900"
    content-class="preview-dialog"
    transition="dialog-bottom-transition"
    @click:outside="previewDialogOpen = false"
  >
    <VCard class="preview-card">
      <VBtn
        class="preview-close-btn"
        icon="bx-x"
        variant="text"
        size="x-small"
        @click="previewDialogOpen = false"
      />
      <div class="preview-img-wrapper">
        <VProgressCircular
          v-if="previewLoading"
          indeterminate
          color="primary"
          size="40"
          width="4"
          class="preview-loader"
        />
        <img
          :key="previewImageUrl"
          :src="previewImageUrl"
          alt="Variant image preview"
          class="preview-img"
          :class="{ 'preview-img--loaded': !previewLoading }"
          @load="previewLoading = false"
          @error="previewLoading = false"
        >
      </div>
    </VCard>
  </VDialog>
</template>

<style scoped>
.variant-thumb {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  isolation: isolate;
  transition:
    transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.25s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
  border: 2px solid rgba(var(--v-border-color), 0.1);
  flex-shrink: 0;
}

.variant-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
}

.variant-thumb-img {
  width: 100%;
  height: 100%;
}

.variant-thumb-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  opacity: 0;
  transition: opacity 0.2s ease;
  backdrop-filter: blur(2px);
}

.variant-thumb:hover .variant-thumb-overlay {
  opacity: 1;
}

.variant-thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-border-color), 0.04);
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(var(--v-border-color), 0.2);
  display: inline-block;
  flex-shrink: 0;
}

:deep(.preview-card) {
  background: transparent !important;
  box-shadow: none !important;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}

:deep(.preview-dialog) {
  box-shadow: none;
}

:deep(.v-overlay__content) {
  top: 0 !important;
}

.preview-img-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  max-height: 85vh;
  max-width: 100%;
}

.preview-img {
  max-height: 85vh;
  max-width: 100%;
  object-fit: contain;
  border-radius: 12px;
  opacity: 0;
  transition: opacity 0.35s ease;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.3);
}

.preview-img--loaded {
  opacity: 1;
}

.preview-loader {
  position: absolute;
  z-index: 1;
}

.preview-close-btn {
  position: absolute !important;
  top: -44px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  background: rgba(255, 255, 255, 0.12) !important;
  backdrop-filter: blur(8px);
  border-radius: 50%;
  transition:
    background 0.2s ease,
    transform 0.2s ease !important;
}

.preview-close-btn:hover {
  background: rgba(255, 255, 255, 0.25) !important;
  transform: translateX(-50%) scale(1.1);
}
</style>

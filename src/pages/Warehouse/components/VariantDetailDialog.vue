<script setup>
import { fetchProductVariantDetail } from '@/services/products'

const props = defineProps({
  variantId: {
    type: Number,
    default: null,
  },
})

const MEDIA_BASE_URL = 'http://belluccidesign.gold'

const dialogModel = defineModel({ type: Boolean, default: false })

const variant = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')
const previewDialogOpen = ref(false)
const previewImageUrl = ref('')
const previewLoading = ref(false)

function fullImageUrl(url) {
  if (!url)
    return ''

  return url.startsWith('http') ? url : `${MEDIA_BASE_URL}${url}`
}

watch(dialogModel, async (open) => {
  if (open && props.variantId) {
    isLoading.value = true
    errorMessage.value = ''
    variant.value = null
    try {
      variant.value = await fetchProductVariantDetail(props.variantId)
    }
    catch (error) {
      errorMessage.value = error?.response?.data?.detail || 'Unable to load details.'
    }
    finally {
      isLoading.value = false
    }
  }
})
</script>

<template>
  <VDialog
    v-model="dialogModel"
    max-width="720"
  >
    <VCard>
      <VCardTitle class="d-flex align-center gap-3 pa-5">
        <VAvatar
          color="info"
          variant="tonal"
          size="44"
        >
          <VIcon
            icon="bx-show"
            size="22"
          />
        </VAvatar>
        <div class="text-h6">
          Variant Details
        </div>
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-5">
        <div
          v-if="isLoading"
          class="d-flex justify-center py-6"
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

        <template v-else-if="variant">
          <VRow>
            <VCol cols="12">
              <div class="text-caption text-medium-emphasis mb-1">
                Product
              </div>
              <div class="text-body-1 font-weight-medium">
                {{ variant.product_name || '—' }}
              </div>
            </VCol>

            <VCol
              cols="12"
              sm="6"
            >
              <div class="text-caption text-medium-emphasis mb-1">
                SKU
              </div>
              <code>{{ variant.sku || '—' }}</code>
            </VCol>

            <VCol
              cols="12"
              sm="6"
            >
              <div class="text-caption text-medium-emphasis mb-1">
                Fee
              </div>
              <div>{{ variant.fee ?? '—' }} {{ variant.fee_type === 'fixed' ? 'IRR' : '%' }}</div>
            </VCol>

            <VCol
              cols="12"
              sm="6"
            >
              <div class="text-caption text-medium-emphasis mb-1">
                Weight
              </div>
              <div>{{ variant.weight ?? '—' }} g</div>
            </VCol>

            <VCol
              cols="12"
              sm="6"
            >
              <div class="text-caption text-medium-emphasis mb-1">
                Fee Status
              </div>
              <VChip
                v-if="variant.available"
                size="small"
                label
                color="success"
                variant="tonal"
              >
                Registered
              </VChip>
              <VChip
                v-else
                size="small"
                label
                color="error"
                variant="tonal"
              >
                Fee Undefined
              </VChip>
            </VCol>

            <VCol
              cols="12"
              sm="6"
            >
              <div class="text-caption text-medium-emphasis mb-1">
                Status
              </div>
              <VChip
                v-if="variant.is_active"
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
            </VCol>

            <VCol
              cols="12"
              sm="6"
            >
              <div class="text-caption text-medium-emphasis mb-1">
                Display Order
              </div>
              <div>{{ variant.display_order ?? 0 }}</div>
            </VCol>

            <VCol
              cols="12"
              sm="6"
            >
              <div class="text-caption text-medium-emphasis mb-1">
                Commission
              </div>
              <div>{{ variant.has_commission || '—' }}</div>
            </VCol>

            <VCol cols="12">
              <div class="text-caption text-medium-emphasis mb-2">
                Colors
              </div>
              <div class="d-flex gap-1 flex-wrap">
                <VChip
                  v-for="color in variant.colors"
                  :key="color.id"
                  size="small"
                  label
                  variant="tonal"
                >
                  <template #prepend>
                    <span
                      class="color-dot me-1"
                      :style="{ backgroundColor: color.code }"
                    />
                  </template>
                  {{ color.name }}
                </VChip>
                <span
                  v-if="!variant.colors?.length"
                  class="text-medium-emphasis"
                >—</span>
              </div>
            </VCol>

            <VCol cols="12">
              <div class="text-caption text-medium-emphasis mb-2">
                Images
              </div>
              <div
                v-if="variant.images?.length"
                class="d-flex gap-2 flex-wrap"
              >
                <div
                  v-for="img in variant.images"
                  :key="img.id"
                  class="detail-image-wrapper"
                  title="View image"
                  @click="previewImageUrl = fullImageUrl(img.image); previewLoading = true; previewDialogOpen = true"
                >
                  <VImg
                    :src="fullImageUrl(img.image)"
                    width="100"
                    height="100"
                    cover
                    class="rounded-lg detail-image"
                  />
                  <div class="detail-image-overlay">
                    <VIcon
                      icon="bx-search"
                      size="18"
                    />
                  </div>
                  <VChip
                    v-if="img.is_primary"
                    size="x-small"
                    color="primary"
                    label
                    class="primary-badge"
                  >
                    Primary
                  </VChip>
                </div>
              </div>
              <span
                v-else
                class="text-medium-emphasis"
              >No images available</span>
            </VCol>
          </VRow>
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
          alt="Image preview"
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
.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(var(--v-border-color), 0.2);
  display: inline-block;
  flex-shrink: 0;
}

.detail-image-wrapper {
  position: relative;
  display: inline-block;
  cursor: pointer;
  border-radius: 12px;
  overflow: hidden;
  transition:
    transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.25s ease;
}

.detail-image-wrapper:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
}

.detail-image-overlay {
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

.detail-image-wrapper:hover .detail-image-overlay {
  opacity: 1;
}

.primary-badge {
  position: absolute;
  top: 4px;
  left: 4px;
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

<script setup>
import { watch } from 'vue'
import { fetchFaqDetail } from '@/services/faqs'

const props = defineProps({
  faqId: {
    type: [Number, String, null],
    default: null,
  },
  products: {
    type: Array,
    default: () => [],
  },
})

const faqDetailModel = defineModel({ type: Boolean, default: false })

const faqDetail = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')

const productMap = computed(() => {
  const map = new Map()

  props.products.forEach(p => map.set(p.id, p.name))

  return map
})

async function loadDetail(id) {
  if (!id && id !== 0)
    return

  isLoading.value = true
  errorMessage.value = ''

  try {
    faqDetail.value = await fetchFaqDetail(id)
  }
  catch (error) {
    faqDetail.value = null
    errorMessage.value = error?.response?.data?.detail || 'Unable to load FAQ details.'
  }
  finally {
    isLoading.value = false
  }
}

watch(faqDetailModel, (open) => {
  if (open && (props.faqId || props.faqId === 0))
    loadDetail(props.faqId)
})
</script>

<template>
  <VDialog
    v-model="faqDetailModel"
    max-width="640"
  >
    <VCard class="faq-detail-card">
      <VCardTitle class="faq-detail-header d-flex align-center gap-3 pa-5">
        <VAvatar
          color="primary"
          variant="tonal"
          size="44"
        >
          <VIcon
            icon="bx-question-mark"
            size="24"
          />
        </VAvatar>
        <div>
          <div class="text-h6">
            FAQ Details
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            ID: {{ faqDetail?.id ?? '—' }}
          </div>
        </div>
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-5">
        <div
          v-if="isLoading"
          class="d-flex justify-center py-8"
        >
          <VProgressCircular
            indeterminate
            color="primary"
            size="40"
          />
        </div>

        <VAlert
          v-else-if="errorMessage"
          type="error"
          variant="tonal"
        >
          {{ errorMessage }}
        </VAlert>

        <template v-else-if="faqDetail">
          <div class="faq-detail-section">
            <div class="faq-detail-label">
              Question
            </div>
            <div class="faq-detail-value">
              {{ faqDetail.question || '—' }}
            </div>
          </div>

          <div class="faq-detail-section mt-5">
            <div class="faq-detail-label">
              Answer
            </div>
            <div class="faq-detail-value faq-detail-answer">
              {{ faqDetail.answer || '—' }}
            </div>
          </div>

          <VRow class="mt-5">
            <VCol cols="6">
              <div class="faq-detail-section">
                <div class="faq-detail-label">
                  Product
                </div>
                <div class="faq-detail-value">
                  <VChip
                    v-if="faqDetail.product"
                    size="small"
                    color="primary"
                    variant="tonal"
                    label
                  >
                    {{ productMap.get(faqDetail.product) || `#${faqDetail.product}` }}
                  </VChip>
                  <span
                    v-else
                    class="text-medium-emphasis"
                  >—</span>
                </div>
              </div>
            </VCol>
            <VCol cols="6">
              <div class="faq-detail-section">
                <div class="faq-detail-label">
                  Display Order
                </div>
                <div class="faq-detail-value">
                  {{ faqDetail.display_order ?? 0 }}
                </div>
              </div>
            </VCol>
          </VRow>

          <div class="faq-detail-section mt-5">
            <div class="faq-detail-label">
              Default
            </div>
            <div class="faq-detail-value">
              <VChip
                :color="faqDetail.is_default ? 'success' : 'secondary'"
                size="small"
                label
                variant="tonal"
              >
                {{ faqDetail.is_default ? 'Yes — For products without a specific question' : 'No' }}
              </VChip>
            </div>
          </div>
        </template>
      </VCardText>

      <VDivider />

      <VCardActions class="d-flex justify-end pa-4">
        <VBtn
          variant="flat"
          color="primary"
          @click="faqDetailModel = false"
        >
          Close
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.faq-detail-card {
  border-radius: 16px;
  overflow: hidden;
}

.faq-detail-header {
  background: rgba(var(--v-theme-primary), 0.04);
}

.faq-detail-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.faq-detail-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(var(--v-theme-on-surface), 0.55);
}

.faq-detail-value {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: rgba(var(--v-theme-on-surface), 0.87);
}

.faq-detail-answer {
  background: rgba(var(--v-theme-on-surface), 0.03);
  border-radius: 10px;
  padding: 12px 16px;
  border: 1px solid rgba(var(--v-border-color), 0.08);
  white-space: pre-wrap;
  word-break: break-word;
}
</style>

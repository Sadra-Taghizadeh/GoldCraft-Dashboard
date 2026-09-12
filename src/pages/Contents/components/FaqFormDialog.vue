<script setup>
import { watch } from 'vue'

const props = defineProps({
  faq: {
    type: Object,
    default: null,
  },
  products: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['save'])

const faqFormModel = defineModel({ type: Boolean, default: false })

const localFaq = ref({
  question: '',
  answer: '',
  product: null,
  is_default: true,
  display_order: 0,
})

const productOptions = computed(() => {
  const items = [
    { title: 'No Product (Public)', value: null },
    ...props.products.map(p => ({
      title: p.name,
      value: p.id,
    })),
  ]

  return items
})

const isDefaultLabel = computed(() => localFaq.value.product ? 'Specific Product Question' : 'Public Question (Default)')

function resetForm() {
  if (props.faq) {
    localFaq.value = {
      question: props.faq.question || '',
      answer: props.faq.answer || '',
      product: props.faq.product_id ?? null,
      is_default: props.faq.product_id ? false : (props.faq.is_default ?? true),
      display_order: props.faq.display_order ?? 0,
    }
  }
  else {
    localFaq.value = {
      question: '',
      answer: '',
      product: null,
      is_default: true,
      display_order: 0,
    }
  }
}

watch(faqFormModel, (open) => {
  if (open)
    resetForm()
})

watch(() => localFaq.value.product, (product) => {
  localFaq.value.is_default = !product
})

function handleSave() {
  emit('save', { ...localFaq.value })
  faqFormModel.value = false
}
</script>

<template>
  <VDialog
    v-model="faqFormModel"
    max-width="720"
  >
    <VCard class="faq-form-card">
      <VCardTitle class="faq-form-header d-flex align-center gap-3 pa-5">
        <VAvatar
          :color="faq ? 'warning' : 'primary'"
          variant="tonal"
          size="44"
        >
          <VIcon
            :icon="faq ? 'bx-edit' : 'bx-plus'"
            size="22"
          />
        </VAvatar>
        <div class="text-h6">
          {{ faq ? 'Edit FAQ' : 'Add New FAQ' }}
        </div>
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-5">
        <VRow>
          <VCol cols="12">
            <div class="form-section-title mb-3">
              Basic Information
            </div>
          </VCol>

          <VCol cols="12">
            <VTextField
              v-model="localFaq.question"
              label="Question"
              :rules="[v => !!v || 'Question is required', v => (v && v.length <= 500) || 'Maximum 500 characters']"
              counter="500"
              density="comfortable"
              variant="outlined"
              prepend-inner-icon="bx-question-mark"
            />
          </VCol>

          <VCol cols="12">
            <VTextarea
              v-model="localFaq.answer"
              label="Answer"
              placeholder="Write the answer text here..."
              auto-grow
              rows="4"
              density="comfortable"
              variant="outlined"
              prepend-inner-icon="bx-message-detail"
            />
          </VCol>

          <VCol cols="12">
            <VDivider class="my-2" />
            <div class="form-section-title my-3">
              Settings
            </div>
          </VCol>

          <VCol
            cols="12"
            md="8"
          >
            <VAutocomplete
              v-model="localFaq.product"
              :items="productOptions"
              item-title="title"
              item-value="value"
              label="Product"
              placeholder="Select product..."
              density="comfortable"
              variant="outlined"
              clearable
              chips
              closable-chips
              prepend-inner-icon="bx-package"
              no-data-text="No products found"
            >
              <template #chip="{ props: chipProps, item }">
                <VChip
                  v-bind="chipProps"
                  size="small"
                  color="primary"
                  variant="tonal"
                  label
                >
                  {{ item.title }}
                </VChip>
              </template>
            </VAutocomplete>
            <div class="text-caption text-medium-emphasis mt-1 ms-1">
              If no product is selected, this question will be displayed for all products.
            </div>
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model.number="localFaq.display_order"
              label="Display Order"
              type="number"
              density="comfortable"
              variant="outlined"
              prepend-inner-icon="bx-sort-a-z"
            />
          </VCol>

          <VCol cols="12">
            <div
              class="default-badge d-flex align-center gap-3 pa-4 rounded-lg"
              :class="localFaq.product ? 'default-badge--specific' : 'default-badge--public'"
            >
              <VIcon
                :icon="localFaq.product ? 'bx-package' : 'bx-globe'"
                size="22"
                :color="localFaq.product ? 'warning' : 'success'"
              />
              <div>
                <div class="text-body-2 font-weight-medium">
                  {{ isDefaultLabel }}
                </div>
                <div class="text-caption text-medium-emphasis mt-1">
                  {{ localFaq.product
                    ? 'This question will only be displayed for the selected product.'
                    : 'This question will be displayed for all products that do not have a specific question.'
                  }}
                </div>
              </div>
            </div>
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <VCardActions class="d-flex justify-end gap-3 pa-5">
        <VBtn
          variant="outlined"
          size="large"
          @click="faqFormModel = false"
        >
          Cancel
        </VBtn>
        <VBtn
          color="primary"
          variant="flat"
          size="large"
          :disabled="!localFaq.question"
          @click="handleSave"
        >
          <VIcon
            start
            :icon="faq ? 'bx-check' : 'bx-plus'"
          />
          {{ faq ? 'Save Changes' : 'Add Question' }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.faq-form-card {
  border-radius: 16px;
  overflow: hidden;
}

.faq-form-header {
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.form-section-title {
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(var(--v-theme-on-surface), 0.45);
}

.default-badge {
  border: 1px solid rgba(var(--v-border-color), 0.08);
}

.default-badge--public {
  background: rgba(var(--v-theme-success), 0.04);
  border-color: rgba(var(--v-theme-success), 0.12);
}

.default-badge--specific {
  background: rgba(var(--v-theme-warning), 0.04);
  border-color: rgba(var(--v-theme-warning), 0.12);
}
</style>

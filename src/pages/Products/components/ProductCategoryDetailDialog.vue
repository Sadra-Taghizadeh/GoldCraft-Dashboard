<script setup>
import { fetchProductCategoryDetail } from '@/services/products'

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
const category = ref(null)

const formatDate = value => value || '—'

async function loadCategory() {
  if (!props.slug)
    return

  isLoading.value = true
  errorMessage.value = ''

  try {
    category.value = await fetchProductCategoryDetail(props.slug)
  }
  catch (error) {
    category.value = null
    errorMessage.value = error?.response?.data?.detail || 'Unable to load category details.'
  }
  finally {
    isLoading.value = false
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      loadCategory()
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
      loadCategory()
    }
  },
)
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="800"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between gap-4 flex-wrap">
        <div>
          <div class="text-h6">
            Category Details
          </div>
          <div class="text-body-2 text-medium-emphasis">
            {{ category?.name || '—' }}
          </div>
        </div>
        <VChip
          v-if="category"
          size="small"
          label
          :color="category.is_active ? 'success' : 'secondary'"
          variant="tonal"
        >
          {{ category.is_active ? 'Active' : 'Inactive' }}
        </VChip>
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

        <template v-else-if="category">
          <div class="rounded-xl border border-[rgba(var(--v-theme-primary),0.14)] bg-[linear-gradient(180deg,rgba(var(--v-theme-surface),0.98),rgba(var(--v-theme-primary),0.02))] p-4 shadow-sm">
            <VRow>
              <VCol
                cols="12"
                md="4"
                class="d-flex justify-center align-start"
              >
                <div
                  class="d-flex align-center justify-center overflow-hidden rounded-xl border border-[rgba(var(--v-theme-primary),0.16)] bg-[linear-gradient(135deg,rgba(var(--v-theme-primary),0.08),rgba(var(--v-theme-primary),0.03))]"
                  style="width: 160px; height: 160px;"
                >
                  <img
                    v-if="category.image"
                    :src="category.image"
                    alt="Category image"
                    class="w-100 h-100 object-cover"
                  >
                  <span
                    v-else
                    class="text-body-2 text-medium-emphasis"
                  >No Image</span>
                </div>
              </VCol>

              <VCol
                cols="12"
                md="8"
              >
                <VRow>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <div class="text-body-2 text-medium-emphasis mb-1">
                      Name
                    </div>
                    <div class="text-body-1 font-weight-medium">
                      {{ category.name || '—' }}
                    </div>
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <div class="text-body-2 text-medium-emphasis mb-1">
                      Slug
                    </div>
                    <div class="text-body-1 font-weight-medium">
                      {{ category.slug || '—' }}
                    </div>
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <div class="text-body-2 text-medium-emphasis mb-1">
                      Status
                    </div>
                    <div class="text-body-1 font-weight-medium">
                      <VChip
                        size="small"
                        label
                        :color="category.is_active ? 'success' : 'secondary'"
                      >
                        {{ category.is_active ? 'Active' : 'Inactive' }}
                      </VChip>
                    </div>
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <div class="text-body-2 text-medium-emphasis mb-1">
                      Display Order
                    </div>
                    <div class="text-body-1 font-weight-medium">
                      {{ category.display_order ?? '—' }}
                    </div>
                  </VCol>
                  <VCol cols="12">
                    <div class="text-body-2 text-medium-emphasis mb-1">
                      Description
                    </div>
                    <div class="text-body-1 font-weight-medium">
                      {{ category.description || '—' }}
                    </div>
                  </VCol>
                  <VCol cols="12">
                    <div class="text-body-2 text-medium-emphasis mb-1">
                      Creation Date
                    </div>
                    <div class="text-body-1 font-weight-medium">
                      {{ formatDate(category.created_at) }}
                    </div>
                  </VCol>
                </VRow>
              </VCol>
            </VRow>
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
  </VDialog>
</template>

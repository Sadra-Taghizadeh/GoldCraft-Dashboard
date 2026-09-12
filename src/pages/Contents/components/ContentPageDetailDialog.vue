<script setup>
import { watch } from 'vue'
import { fetchContentPageDetail } from '@/services/contents'

const props = defineProps({
  slug: {
    type: String,
    default: '',
  },
})

const contentPageDetailModel = defineModel({ type: Boolean, default: false })

const pageDetail = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')

const statusLabels = {
  true: 'Published',
  false: 'Draft',
}

const formatDate = value => value || '—'

async function loadDetail(slug) {
  if (!slug)
    return

  isLoading.value = true
  errorMessage.value = ''

  try {
    pageDetail.value = await fetchContentPageDetail(slug)
  }
  catch (error) {
    pageDetail.value = null
    errorMessage.value = error?.response?.data?.detail || 'Unable to load page details.'
  }
  finally {
    isLoading.value = false
  }
}

watch(contentPageDetailModel, (open) => {
  if (open && props.slug) {
    loadDetail(props.slug)
  }
})
</script>

<template>
  <VDialog
    v-model="contentPageDetailModel"
    max-width="700"
  >
    <VCard>
      <VCardTitle class="d-flex align-center gap-3">
        <VIcon
          size="24"
          icon="bx-file"
        />
        <span>Page Details</span>
      </VCardTitle>

      <VCardText>
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

        <template v-else-if="pageDetail">
          <VRow>
            <VCol cols="12">
              <VTextField
                :model-value="pageDetail.title"
                label="Title"
                readonly
                variant="plain"
              />
            </VCol>

            <VCol cols="12">
              <VTextField
                :model-value="pageDetail.slug"
                label="Slug"
                readonly
                variant="plain"
              />
            </VCol>

            <VCol cols="12">
              <VTextField
                :model-value="statusLabels[pageDetail.is_published]"
                label="Status"
                readonly
                variant="plain"
              >
                <template #prepend-inner>
                  <VChip
                    size="small"
                    label
                    :color="pageDetail.is_published ? 'success' : 'secondary'"
                  >
                    {{ statusLabels[pageDetail.is_published] }}
                  </VChip>
                </template>
              </VTextField>
            </VCol>

            <VCol cols="12">
              <VTextarea
                :model-value="pageDetail.content"
                label="Content"
                readonly
                variant="plain"
                auto-grow
                rows="6"
              />
            </VCol>

            <VCol cols="6">
              <VTextField
                :model-value="formatDate(pageDetail.created_at)"
                label="Created Date"
                readonly
                variant="plain"
              />
            </VCol>

            <VCol cols="6">
              <VTextField
                :model-value="formatDate(pageDetail.updated_at)"
                label="Last Updated"
                readonly
                variant="plain"
              />
            </VCol>
          </VRow>
        </template>
      </VCardText>

      <VCardActions class="d-flex justify-end pa-4">
        <VBtn
          variant="outlined"
          @click="contentPageDetailModel = false"
        >
          Close
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

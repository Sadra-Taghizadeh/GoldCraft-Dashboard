<script setup>
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog.vue'
import {
  createFaq,
  deleteFaq,
  fetchFaqs,
  updateFaq,
} from '@/services/faqs'

const props = defineProps({
  product: {
    type: Object,
    default: null,
  },
})

const productFaqModel = defineModel({ type: Boolean, default: false })

const faqs = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const formOpen = ref(false)
const deleteDialogOpen = ref(false)
const faqToDelete = ref(null)
const editingFaq = ref(null)

const localForm = ref({
  question: '',
  answer: '',
  is_default: false,
  display_order: 0,
})

async function loadFaqs() {
  if (!props.product?.id)
    return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await fetchFaqs({ product_id: props.product.id })

    faqs.value = Array.isArray(response) ? response : []
  }
  catch (error) {
    faqs.value = []
    errorMessage.value = error?.response?.data?.detail || 'Unable to load FAQs.'
  }
  finally {
    isLoading.value = false
  }
}

function openCreateForm() {
  editingFaq.value = null
  localForm.value = {
    question: '',
    answer: '',
    is_default: false,
    display_order: 0,
  }
  formOpen.value = true
}

function openEditForm(faq) {
  editingFaq.value = faq
  localForm.value = {
    question: faq.question || '',
    answer: faq.answer || '',
    is_default: faq.is_default ?? false,
    display_order: faq.display_order ?? 0,
  }
  formOpen.value = true
}

async function handleSaveForm() {
  if (!localForm.value.question)
    return

  const payload = {
    ...localForm.value,
    product: props.product?.id ?? null,
  }

  try {
    if (editingFaq.value) {
      await updateFaq(editingFaq.value.id, payload)
    }
    else {
      await createFaq(payload)
    }

    formOpen.value = false
    editingFaq.value = null
    await loadFaqs()
  }
  catch (error) {
    errorMessage.value = error?.response?.data?.detail || 'Unable to save FAQ.'
  }
}

function handleDelete(faq) {
  faqToDelete.value = faq
  deleteDialogOpen.value = true
}

async function confirmDelete() {
  if (!faqToDelete.value?.id)
    return

  try {
    await deleteFaq(faqToDelete.value.id)
    await loadFaqs()
    deleteDialogOpen.value = false
    faqToDelete.value = null
  }
  catch (error) {
    errorMessage.value = error?.response?.data?.detail || 'Unable to delete FAQ.'
  }
}

watch(productFaqModel, (open) => {
  if (open)
    loadFaqs()
})
</script>

<template>
  <VDialog
    v-model="productFaqModel"
    max-width="900"
  >
    <VCard class="faq-list-card">
      <VCardTitle class="faq-list-header d-flex align-center gap-3 pa-5">
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
            Product FAQs
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            {{ product?.name || '' }}
          </div>
        </div>
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-5">
        <VAlert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          class="mb-4"
        >
          {{ errorMessage }}
        </VAlert>

        <div class="d-flex justify-end mb-4">
          <VBtn
            color="primary"
            variant="flat"
            size="small"
            @click="openCreateForm"
          >
            <VIcon
              start
              icon="bx-plus"
              size="18"
            />
            Add Question
          </VBtn>
        </div>

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

        <VTable
          v-else
          class="text-no-wrap"
        >
          <thead>
            <tr>
              <th class="text-uppercase">
                Question
              </th>
              <th class="text-uppercase">
                Answer
              </th>
              <th class="text-uppercase">
                Order
              </th>
              <th class="text-uppercase text-end">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="faqs.length === 0">
              <td
                colspan="4"
                class="text-center text-medium-emphasis py-8"
              >
                <VIcon
                  icon="bx-message-square-x"
                  size="40"
                  class="mb-2"
                  color="disabled"
                />
                <div>No questions have been defined for this product.</div>
              </td>
            </tr>
            <tr
              v-for="faq in faqs"
              :key="faq.id"
            >
              <td>{{ faq.question || '—' }}</td>
              <td>{{ faq.answer ? (faq.answer.length > 60 ? `${faq.answer.slice(0, 60)}...` : faq.answer) : '—' }}</td>
              <td>{{ faq.display_order }}</td>
              <td class="text-end">
                <IconBtn
                  size="small"
                  @click="openEditForm(faq)"
                >
                  <VIcon
                    icon="bx-edit"
                    size="18"
                  />
                </IconBtn>
                <IconBtn
                  size="small"
                  @click="handleDelete(faq)"
                >
                  <VIcon
                    icon="bx-trash"
                    size="18"
                  />
                </IconBtn>
              </td>
            </tr>
          </tbody>
        </VTable>
      </VCardText>

      <VDivider />

      <VCardActions class="d-flex justify-end pa-4">
        <VBtn
          variant="flat"
          color="primary"
          @click="productFaqModel = false"
        >
          Close
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Add / Edit Form Dialog -->
  <VDialog
    v-model="formOpen"
    max-width="720"
  >
    <VCard class="faq-form-card">
      <VCardTitle class="faq-form-header d-flex align-center gap-3 pa-5">
        <VAvatar
          :color="editingFaq ? 'warning' : 'primary'"
          variant="tonal"
          size="44"
        >
          <VIcon
            :icon="editingFaq ? 'bx-edit' : 'bx-plus'"
            size="22"
          />
        </VAvatar>
        <div>
          <div class="text-h6">
            {{ editingFaq ? 'Edit FAQ' : 'Add New FAQ' }}
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            {{ product?.name || '' }}
          </div>
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
              v-model="localForm.question"
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
              v-model="localForm.answer"
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

          <VCol cols="12">
            <div class="product-badge d-flex align-center gap-3 pa-4 rounded-lg">
              <VIcon
                icon="bx-package"
                size="22"
                color="primary"
              />
              <div>
                <div class="text-body-2 font-weight-medium">
                  Specific to Product: {{ product?.name || '' }}
                </div>
                <div class="text-caption text-medium-emphasis mt-1">
                  This question will only be displayed for this product.
                </div>
              </div>
            </div>
          </VCol>

          <VCol cols="12">
            <VTextField
              v-model.number="localForm.display_order"
              label="Display Order"
              type="number"
              density="comfortable"
              variant="outlined"
              prepend-inner-icon="bx-sort-a-z"
            />
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <VCardActions class="d-flex justify-end gap-3 pa-5">
        <VBtn
          variant="outlined"
          size="large"
          @click="formOpen = false"
        >
          Cancel
        </VBtn>
        <VBtn
          color="primary"
          variant="flat"
          size="large"
          :disabled="!localForm.question"
          @click="handleSaveForm"
        >
          <VIcon
            start
            :icon="editingFaq ? 'bx-check' : 'bx-plus'"
          />
          {{ editingFaq ? 'Save Changes' : 'Add Question' }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <DeleteConfirmDialog
    v-model="deleteDialogOpen"
    title="Delete FAQ"
    :message="`Are you sure you want to delete the question \u00AB${faqToDelete?.question || ''}\u00BB?`"
    confirm-text="Delete"
    :loading="isLoading"
    @confirm="confirmDelete"
  />
</template>

<style scoped>
.faq-list-card {
  border-radius: 16px;
  overflow: hidden;
}

.faq-list-header {
  background: rgba(var(--v-theme-primary), 0.04);
}

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

.product-badge {
  background: rgba(var(--v-theme-primary), 0.04);
  border: 1px solid rgba(var(--v-theme-primary), 0.12);
}
</style>

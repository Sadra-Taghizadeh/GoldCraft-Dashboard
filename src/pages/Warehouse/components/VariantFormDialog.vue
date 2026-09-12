<script setup>
import { watch } from 'vue'
import { updateProductVariant } from '@/services/products'

const props = defineProps({
  variant: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['save'])

const formModel = defineModel({ type: Boolean, default: false })

const localVariant = ref({
  sku: '',
  is_active: true,
  display_order: 0,
})

const isSaving = ref(false)
const errorMessage = ref('')

function resetForm() {
  errorMessage.value = ''
  if (props.variant) {
    localVariant.value = {
      sku: props.variant.sku || '',
      is_active: props.variant.is_active ?? true,
      display_order: props.variant.display_order ?? 0,
    }
  }
}

watch(formModel, (open) => {
  if (open)
    resetForm()
})

async function handleSave() {
  if (!props.variant?.id)
    return

  isSaving.value = true
  errorMessage.value = ''

  try {
    await updateProductVariant(props.variant.id, { ...localVariant.value })
    emit('save')
    formModel.value = false
  }
  catch (error) {
    errorMessage.value = error?.response?.data?.detail || 'Unable to save changes.'
  }
  finally {
    isSaving.value = false
  }
}
</script>

<template>
  <VDialog
    v-model="formModel"
    max-width="560"
  >
    <VCard>
      <VCardTitle class="d-flex align-center gap-3 pa-5">
        <VAvatar
          color="warning"
          variant="tonal"
          size="44"
        >
          <VIcon
            icon="bx-edit"
            size="22"
          />
        </VAvatar>
        <div class="text-h6">
          Edit Variant
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

        <VRow>
          <VCol cols="12">
            <div class="text-caption text-medium-emphasis mb-1">
              Product
            </div>
            <div class="text-body-1 font-weight-medium mb-4">
              {{ variant?.product_name || '—' }}
            </div>
          </VCol>

          <VCol
            cols="12"
            sm="6"
          >
            <VTextField
              v-model="localVariant.sku"
              label="SKU"
              density="comfortable"
              variant="outlined"
              readonly
            />
          </VCol>

          <VCol
            cols="12"
            sm="6"
          >
            <VTextField
              v-model.number="localVariant.display_order"
              label="Display Order"
              type="number"
              density="comfortable"
              variant="outlined"
              prepend-inner-icon="bx-sort-a-z"
            />
          </VCol>

          <VCol
            cols="12"
            sm="6"
          >
            <VSwitch
              v-model="localVariant.is_active"
              label="Active"
              color="success"
              density="comfortable"
              hide-details
              class="mt-2"
            />
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <VCardActions class="d-flex justify-end gap-3 pa-5">
        <VBtn
          variant="outlined"
          size="large"
          :disabled="isSaving"
          @click="formModel = false"
        >
          Cancel
        </VBtn>
        <VBtn
          color="primary"
          variant="flat"
          size="large"
          :loading="isSaving"
          @click="handleSave"
        >
          <VIcon
            start
            icon="bx-check"
          />
          Save Changes
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

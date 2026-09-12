<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  currency: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'save'])

const form = reactive({
  name: '',
  slug: '',
  price: '',
})

const isEditMode = computed(() => !!props.currency)

function syncForm() {
  form.name = props.currency?.name || ''
  form.slug = props.currency?.slug || ''
  form.price = props.currency?.price ?? ''
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      syncForm()
    }
  },
)

watch(
  () => props.currency,
  () => {
    if (props.modelValue) {
      syncForm()
    }
  },
  { deep: true },
)

function submit() {
  emit('save', {
    ...form,
    name: `${form.name ?? ''}`.trim(),
    slug: `${form.slug ?? ''}`.trim(),
    price: `${form.price ?? ''}`.trim() !== '' ? Number(form.price) : null,
  })
}
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="520"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VCard>
      <VCardTitle class="text-h6">
        {{ isEditMode ? 'Edit Currency' : 'Add New Currency' }}
      </VCardTitle>

      <VDivider />

      <VCardText class="pt-4">
        <VRow>
          <VCol cols="12">
            <VTextField
              v-model="form.name"
              label="Currency Name"
              variant="outlined"
              density="comfortable"
              hide-details="auto"
              required
            />
          </VCol>

          <VCol cols="12">
            <VTextField
              v-model="form.slug"
              label="Currency Code"
              variant="outlined"
              density="comfortable"
              hide-details="auto"
              required
            />
          </VCol>

          <VCol cols="12">
            <VTextField
              v-model="form.price"
              v-persian-convert
              label="Price (Toman)"
              variant="outlined"
              density="comfortable"
              hide-details="auto"
              type="number"
              required
            />
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <VCardActions class="justify-end gap-2 pa-4">
        <VBtn
          variant="text"
          @click="emit('update:modelValue', false)"
        >
          Cancel
        </VBtn>
        <VBtn
          color="primary"
          @click="submit"
        >
          Save
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

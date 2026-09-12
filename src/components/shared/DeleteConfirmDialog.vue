<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: 'Delete Item',
  },
  message: {
    type: String,
    default: 'Are you sure you want to delete this item?',
  },
  confirmText: {
    type: String,
    default: 'Delete',
  },
  cancelText: {
    type: String,
    default: 'Cancel',
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

function handleClose() {
  emit('update:modelValue', false)
}

function handleConfirm() {
  emit('confirm')
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
        {{ title }}
      </VCardTitle>

      <VDivider />

      <VCardText>
        <p class="text-body-1 mb-0">
          {{ message }}
        </p>
      </VCardText>

      <VDivider />

      <VCardActions class="justify-end gap-2">
        <VBtn
          variant="text"
          :disabled="loading"
          @click="handleClose"
        >
          {{ cancelText }}
        </VBtn>

        <VBtn
          color="error"
          :loading="loading"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

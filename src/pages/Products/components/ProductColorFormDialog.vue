<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  color: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'save'])

const form = reactive({
  name: '',
  code: '',
})

const isEditMode = computed(() => !!props.color)

const normalizedCode = computed(() => {
  const value = `${form.code ?? ''}`.trim()

  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) {
    return value.toUpperCase()
  }

  return '#d9d9d9'
})

const previewLabel = computed(() => (form.code?.trim() ? normalizedCode.value : 'No color code'))

const previewContrastColor = computed(() => {
  const hex = normalizedCode.value.replace('#', '')
  const expanded = hex.length === 3 ? hex.split('').map(char => char + char).join('') : hex
  const red = Number.parseInt(expanded.slice(0, 2), 16)
  const green = Number.parseInt(expanded.slice(2, 4), 16)
  const blue = Number.parseInt(expanded.slice(4, 6), 16)
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000

  return brightness >= 150 ? '#1b1b1b' : '#ffffff'
})

function syncForm() {
  form.name = props.color?.name || ''
  form.code = props.color?.code || ''
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
  () => props.color,
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
    code: `${form.code ?? ''}`.trim(),
  })
}
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="720"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VCard class="product-color-dialog elevation-8">
      <VCardTitle class="dialog-header d-flex align-center justify-space-between gap-4 flex-wrap">
        <div>
          <div class="text-overline text-medium-emphasis mb-1">
            Product Color Management
          </div>
          <div class="text-h6">
            {{ isEditMode ? 'Edit Color' : 'Add New Color' }}
          </div>
        </div>

        <VChip
          size="small"
          label
          color="primary"
          variant="tonal"
        >
          {{ isEditMode ? 'Edit Mode' : 'Add Mode' }}
        </VChip>
      </VCardTitle>

      <VDivider />

      <VCardText>
        <VSheet
          class="preview-panel mb-6"
          rounded="xl"
          :style="{
            background: `linear-gradient(135deg, ${normalizedCode} 0%, rgba(255,255,255,0.14) 100%)`,
            color: previewContrastColor,
          }"
        >
          <div class="preview-panel__inner">
            <div>
              <div class="text-overline preview-muted">
                Live Preview
              </div>
              <div class="text-h5 font-weight-bold">
                {{ form.name || 'Color Name' }}
              </div>
              <div class="text-body-2 preview-muted mt-1">
                {{ previewLabel }}
              </div>
            </div>

            <div class="preview-badge-group">
              <div class="preview-badge">
                <span class="preview-badge__label">Code</span>
                <span class="preview-badge__value">{{ previewLabel }}</span>
              </div>
              <div
                class="preview-badge preview-badge--solid"
                :style="{ color: previewContrastColor }"
              >
                <span
                  class="preview-badge__dot"
                  :style="{ backgroundColor: normalizedCode }"
                />
                <span class="preview-badge__value">{{ isEditMode ? 'Ready to Edit' : 'New Color' }}</span>
              </div>
            </div>
          </div>
        </VSheet>

        <VRow class="field-grid">
          <VCol cols="12">
            <VTextField
              v-model="form.name"
              label="Color Name"
              placeholder="e.g. Gold"
              variant="outlined"
              density="comfortable"
              hide-details="auto"
              required
            />
          </VCol>

          <VCol cols="12">
            <div class="color-input-group">
              <div class="color-input-row">
                <div
                  class="color-preview"
                  :style="{ backgroundColor: normalizedCode }"
                />
                <div>
                  <div class="text-subtitle-2 font-weight-medium">
                    Color Picker
                  </div>
                  <div class="text-body-2 text-medium-emphasis">
                    Choose from the color palette or enter a hex code.
                  </div>
                </div>
                <input
                  class="color-input"
                  type="color"
                  :value="normalizedCode"
                  aria-label="Color Picker"
                  @input="form.code = $event.target.value"
                >
              </div>

              <VTextField
                v-model="form.code"
                label="Color Code"
                placeholder="#D4AF37"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
                required
              />
            </div>
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <VCardActions class="dialog-actions justify-end gap-3">
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

<style scoped>
.product-color-dialog {
  overflow: hidden;
}

.dialog-header {
  padding-block: 22px;
}

.preview-panel {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  box-shadow: 0 12px 36px rgba(15, 23, 42, 0.12);
}

.preview-panel::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.22), transparent 36%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(0, 0, 0, 0.05));
  pointer-events: none;
}

.preview-panel__inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  padding: 20px;
  min-height: 150px;
}

.preview-muted {
  opacity: 0.86;
}

.preview-badge-group {
  display: grid;
  gap: 10px;
  min-width: 180px;
}

.preview-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(8px);
}

.preview-badge--solid {
  background: rgba(255, 255, 255, 0.24);
}

.preview-badge__label {
  font-size: 0.78rem;
  opacity: 0.82;
}

.preview-badge__value {
  font-weight: 600;
  word-break: break-word;
}

.preview-badge__dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.45);
}

.field-grid {
  row-gap: 18px;
}

.color-input-group {
  display: grid;
  gap: 14px;
}

.color-input-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border-radius: 18px;
  background: rgba(var(--v-theme-surface-variant), 0.35);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.color-preview {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  border: 2px solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
}

.color-input {
  width: 52px;
  height: 52px;
  padding: 0;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 16px;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
}

.color-input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-input::-webkit-color-swatch {
  border: 0;
  border-radius: 13px;
}

.color-input::-moz-color-swatch {
  border: 0;
  border-radius: 13px;
}

.dialog-actions {
  padding-block: 16px;
}

@media (max-width: 600px) {
  .preview-panel__inner,
  .color-input-row {
    align-items: stretch;
    flex-direction: column;
  }

  .preview-badge-group {
    min-width: 0;
  }

  .color-input {
    align-self: flex-start;
  }
}
</style>

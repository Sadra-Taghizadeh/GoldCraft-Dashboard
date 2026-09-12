<script setup>
import { processImageForUpload } from '@/utils/imageOptimizer'
import { generateSlug } from '@/utils/slug'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  category: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'save'])

const imageInput = ref(null)

const form = reactive({
  name: '',
  slug: '',
  description: '',
  is_active: true,
  display_order: 0,
  imageFile: null,
  imagePreviewUrl: '',
})

const isProcessingImage = ref(false)

const isEditMode = computed(() => !!props.category)

let slugManuallyEdited = false

watch(() => form.name, (name) => {
  if (!slugManuallyEdited) {
    form.slug = generateSlug(name)
  }
})

watch(() => form.slug, () => {
  if (form.slug !== generateSlug(form.name)) {
    slugManuallyEdited = true
  }
})

function syncForm() {
  form.name = props.category?.name || ''
  form.slug = props.category?.slug || ''
  form.description = props.category?.description || ''
  form.is_active = props.category?.is_active ?? true
  form.display_order = props.category?.display_order ?? 0
  form.imageFile = null
  form.imagePreviewUrl = props.category?.image || ''
  slugManuallyEdited = !!props.category
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
  () => props.category,
  () => {
    if (props.modelValue) {
      syncForm()
    }
  },
  { deep: true },
)

async function handleImageChange(event) {
  const file = event?.target?.files?.[0]
  if (!file)
    return
  if (form.imagePreviewUrl?.startsWith('blob:')) {
    URL.revokeObjectURL(form.imagePreviewUrl)
  }

  isProcessingImage.value = true
  try {
    const { file: optimizedFile } = await processImageForUpload(file)

    form.imageFile = optimizedFile
    form.imagePreviewUrl = URL.createObjectURL(optimizedFile)
  }
  catch {
    form.imageFile = file
    form.imagePreviewUrl = URL.createObjectURL(file)
  }
  finally {
    isProcessingImage.value = false
  }
}

function removeImage() {
  if (form.imagePreviewUrl?.startsWith('blob:')) {
    URL.revokeObjectURL(form.imagePreviewUrl)
  }
  form.imageFile = null
  form.imagePreviewUrl = ''
  if (imageInput.value) {
    imageInput.value.value = ''
  }
}

function triggerImagePicker() {
  imageInput.value?.click()
}

function submit() {
  emit('save', {
    name: form.name,
    slug: form.slug,
    description: form.description,
    is_active: form.is_active,
    display_order: Number(form.display_order) || 0,
    imageFile: form.imageFile,
  })
}

onBeforeUnmount(() => {
  if (form.imagePreviewUrl?.startsWith('blob:')) {
    URL.revokeObjectURL(form.imagePreviewUrl)
  }
})
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="720"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VCard>
      <VCardTitle class="text-h6">
        {{ isEditMode ? 'Edit Category' : 'Add Category' }}
      </VCardTitle>

      <VDivider />

      <VCardText>
        <section class="mb-4 rounded-xl border border-[rgba(var(--v-theme-primary),0.14)] bg-[linear-gradient(180deg,rgba(var(--v-theme-surface),0.98),rgba(var(--v-theme-primary),0.02))] p-4 shadow-sm">
          <div class="mb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <div>
              <div class="text-sm font-semibold text-[rgb(var(--v-theme-on-surface))]">
                Category Information
              </div>
              <div class="text-xs text-medium-emphasis">
                Enter the category name and details
              </div>
            </div>
            <VSwitch
              v-model="form.is_active"
              label="Active"
              inset
            />
          </div>

          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.name"
                label="Name"
                required
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.slug"
                label="Slug"
                required
                hint="Auto-completed from name"
                persistent-hint
              />
            </VCol>
            <VCol cols="12">
              <VTextarea
                v-model="form.description"
                label="Description"
                rows="3"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.display_order"
                v-persian-convert
                label="Display Order"
                type="number"
              />
            </VCol>
          </VRow>
        </section>

        <section class="rounded-xl border border-[rgba(var(--v-theme-primary),0.14)] bg-[linear-gradient(180deg,rgba(var(--v-theme-surface),0.98),rgba(var(--v-theme-primary),0.02))] p-4 shadow-sm">
          <div class="mb-4">
            <div class="text-sm font-semibold text-[rgb(var(--v-theme-on-surface))]">
              Category Image
            </div>
            <div class="text-xs text-medium-emphasis">
              Upload an image for the category
            </div>
          </div>

          <input
            ref="imageInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleImageChange"
          >

          <div class="flex flex-col sm:flex-row items-start gap-4">
            <div
              class="flex-shrink-0 d-flex align-center justify-center overflow-hidden rounded-xl border border-[rgba(var(--v-theme-primary),0.16)] bg-[linear-gradient(135deg,rgba(var(--v-theme-primary),0.08),rgba(var(--v-theme-primary),0.03))]"
              style="width: 140px; height: 140px;"
            >
              <img
                v-if="form.imagePreviewUrl"
                :src="form.imagePreviewUrl"
                alt="Category preview"
                class="w-100 h-100 object-cover"
              >
              <VProgressCircular
                v-if="isProcessingImage"
                indeterminate
                color="primary"
                size="32"
                width="3"
                class="absolute"
              />
              <div
                v-if="!form.imagePreviewUrl"
                class="d-flex flex-column align-center justify-center text-center px-2"
              >
                <div class="text-sm font-bold tracking-[0.22em] text-[rgb(var(--v-theme-primary))]">
                  IMAGE
                </div>
                <div class="mt-1 text-xs text-medium-emphasis">
                  Not selected
                </div>
              </div>
            </div>

            <div class="d-flex flex-wrap gap-2 mt-2 sm:mt-0">
              <VBtn
                size="small"
                color="primary"
                variant="flat"
                @click="triggerImagePicker"
              >
                Select Image
              </VBtn>
              <VBtn
                v-if="form.imagePreviewUrl"
                size="small"
                variant="tonal"
                color="error"
                @click="removeImage"
              >
                Delete
              </VBtn>
            </div>
          </div>
        </section>
      </VCardText>

      <VDivider />

      <VCardActions class="justify-end gap-2 px-4 pb-4">
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

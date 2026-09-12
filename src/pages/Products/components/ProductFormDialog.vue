<script setup>
import ProductColorFormDialog from '@/pages/Products/components/ProductColorFormDialog.vue'
import { quantityTierMeta, weightOverrideMeta } from '@/pages/Products/composables/useFeeProfile'
import { useProductColors } from '@/pages/Products/composables/useProductColors'
import { useProductErrors } from '@/pages/Products/composables/useProductErrors'
import { useProductFormSubmit } from '@/pages/Products/composables/useProductFormSubmit'
import { useProductImages } from '@/pages/Products/composables/useProductImages'
import { fetchProductVariantQR } from '@/services/products'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  product: {
    type: Object,
    default: null,
  },
  categories: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue', 'save'])

let variantCounter = 0

function createVariantObject(overrides = {}) {
  return reactive({
    _key: `v-${++variantCounter}-${Date.now()}`,
    _isNew: true,
    _isDefault: false,
    _serverId: null,
    color_ids: [],
    sku: '',
    fee: '',
    fee_type: 'fixed',
    weight: '',
    imageItems: [],
    removedImageIds: [],
    _errors: null,
    ...overrides,
  })
}

const cloneEmptyFeeProfile = () => JSON.parse(JSON.stringify(emptyFeeProfile))

const emptyFeeProfile = {
  id: null,
  fee_type: 'percent',
  base_fee: '',
  base_weight: '',
  base_quantity: 1,
  is_active: true,
  weight_overrides: [
    { multiplier: '0.25', fee_value: '' },
    { multiplier: '0.50', fee_value: '' },
    { multiplier: '2.00', fee_value: '' },
    { multiplier: '4.00', fee_value: '' },
  ],
  custom_weight_overrides: [],
  quantity_tiers: [
    { min_quantity: 5, fee_value: '' },
    { min_quantity: 10, fee_value: '' },
    { min_quantity: 20, fee_value: '' },
    { min_quantity: 25, fee_value: '' },
  ],
}

const form = reactive({
  name: '',
  category: null,
  description: '',
  is_active: true,
  is_featured: false,
  variants: [createVariantObject({ _isDefault: true })],
  product_fee_profile: cloneEmptyFeeProfile(),
})

const activeVariantIndex = ref(0)
const activeVariant = computed(() => form.variants[activeVariantIndex.value] || form.variants[0])

const isEditMode = computed(() => !!props.product)
const formLoading = ref(false)

const {
  productError,
  sectionError,
  productFieldErrors,
  getVariantErrors,
  extractProductFieldErrors,
  extractVariantFieldErrors,
  clearAllErrors,
} = useProductErrors()

const {
  colorSwatches,
  colorDialogOpen,
  selectedColor,
  loadColors,
  selectColor,
  addColor,
  handleColorSave,
} = useProductColors(activeVariant)

const {
  variantImageInput,
  triggerVariantImagePicker,
  handleVariantImageChange,
  setPrimaryImage,
  removeImageItem,
  buildVariantFormData,
  syncImageIdsFromResponse,
} = useProductImages(activeVariant)

const weightOverrideTab = ref('fixed')

const imageModalOpen = ref(false)
const imageModalVariant = ref(null)
const imageModalIndex = ref(0)

function openImageModal(variant) {
  imageModalVariant.value = variant
  imageModalIndex.value = 0
  imageModalOpen.value = true
}

function imageModalSetPrimary(imgIndex) {
  if (!imageModalVariant.value)
    return
  setPrimaryImage(imgIndex, imageModalVariant.value)
}

function imageModalRemove(imgIndex) {
  if (!imageModalVariant.value)
    return
  removeImageItem(imgIndex, imageModalVariant.value)
  if (imageModalIndex.value >= imageModalVariant.value.imageItems.length) {
    imageModalIndex.value = Math.max(0, imageModalVariant.value.imageItems.length - 1)
  }
  if (imageModalVariant.value.imageItems.length === 0) {
    imageModalOpen.value = false
  }
}

function imageModalAdd() {
  if (!imageModalVariant.value)
    return
  triggerVariantImagePicker(imageModalVariant.value)
}

function buildVariantFormDataForVariant(productId, variant, options) {
  return buildVariantFormData(productId, variant, options)
}

const {
  submitting,
  submit,
  resetSubmitState,
  snapshotVariant,
  variantsToDelete,
} = useProductFormSubmit({
  form,
  getProduct: () => props.product,
  buildVariantFormDataForVariant,
  syncImageIdsFromResponse,
  extractProductFieldErrors,
  extractVariantFieldErrors,
  getVariantErrors,
  productError,
  sectionError,
  emit,
})

function getVariantLabel(variant, index) {
  if (variant.color_ids.length > 0) {
    const names = variant.color_ids
      .map(id => colorSwatches.value.find(s => s.id === id)?.label)
      .filter(Boolean)

    if (names.length > 0)
      return names.join(' / ')
  }

  return variant._isDefault ? 'Default' : `Variant ${index + 1}`
}

function updateProductWeightOverrideFee(woIndex, value) {
  form.product_fee_profile.weight_overrides[woIndex].fee_value = value
}

function updateProductQuantityTierFee(tierIndex, value) {
  form.product_fee_profile.quantity_tiers[tierIndex].fee_value = value
}

function updateProductCustomWeightOverrideWeight(index, value) {
  form.product_fee_profile.custom_weight_overrides[index].weight = value
}

function updateProductCustomWeightOverrideFee(index, value) {
  form.product_fee_profile.custom_weight_overrides[index].fee_value = value
}

function addProductCustomWeightOverride() {
  form.product_fee_profile.custom_weight_overrides.push({ weight: '', fee_value: '' })
}

function removeProductCustomWeightOverride(index) {
  form.product_fee_profile.custom_weight_overrides.splice(index, 1)
}

function addVariant() {
  const variant = createVariantObject()

  form.variants.push(variant)
  snapshotVariant(variant)
  activeVariantIndex.value = form.variants.length - 1
}

function removeVariant(index) {
  if (form.variants[index]._isDefault)
    return

  const variant = form.variants[index]
  if (variant._serverId && !variant._isNew) {
    variantsToDelete.value.push(variant._serverId)
  }

  variant.imageItems.forEach((item) => {
    if (item.file && item.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(item.previewUrl)
    }
  })

  form.variants.splice(index, 1)
  if (activeVariantIndex.value >= form.variants.length) {
    activeVariantIndex.value = form.variants.length - 1
  }
}

async function syncForm() {
  formLoading.value = true
  try {
    resetSubmitState()

    const p = props.product

    form.name = p?.name || ''
    form.category = p?.category?.id || null
    form.description = p?.description || ''
    form.is_active = p?.is_active ?? true
    form.is_featured = p?.is_featured ?? false

    const pfp = p?.product_fee_profile || null
    if (pfp) {
      form.product_fee_profile.id = pfp.id || null
      form.product_fee_profile.fee_type = pfp.fee_type || 'percent'
      form.product_fee_profile.base_fee = pfp.base_fee || ''
      form.product_fee_profile.base_weight = pfp.base_weight || ''
      form.product_fee_profile.base_quantity = pfp.base_quantity ?? 1
      form.product_fee_profile.is_active = pfp.is_active ?? true

      if (Array.isArray(pfp.weight_overrides)) {
        const fixed = pfp.weight_overrides.filter(wo => wo.rule_type === 'multiplier')
        const custom = pfp.weight_overrides.filter(wo => wo.rule_type === 'exact_weight')

        form.product_fee_profile.weight_overrides = ['0.25', '0.50', '2.00', '4.00'].map((multiplier) => {
          const existing = fixed.find(f => Number(f.multiplier) === Number(multiplier))

          return { multiplier, fee_value: existing?.fee_value ?? '' }
        })

        form.product_fee_profile.custom_weight_overrides = custom.map(c => ({
          weight: c.exact_weight ?? '',
          fee_value: c.fee_value ?? '',
        }))
      }

      if (Array.isArray(pfp.quantity_tiers)) {
        form.product_fee_profile.quantity_tiers = [5, 10, 20, 25].map((minQuantity) => {
          const existing = pfp.quantity_tiers.find(t => Number(t.min_quantity) === Number(minQuantity))

          return { min_quantity: minQuantity, fee_value: existing?.fee_value ?? '' }
        })
      }
    }
    else {
      form.product_fee_profile = cloneEmptyFeeProfile()
    }

    await loadColors()

    form.variants = []

    if (Array.isArray(p?.variants) && p.variants.length > 0) {
      p.variants.forEach((v, idx) => {
        const variant = createVariantObject({
          _isNew: false,
          _isDefault: idx === 0,
          _serverId: v.id,
          color_ids: Array.isArray(v.colors)
            ? v.colors.map(c => c.id)
            : v.color_id
              ? [v.color_id]
              : [],
          sku: v.sku || '',
          fee: v.fee ?? '',
          fee_type: v.fee_type ?? 'fixed',
          weight: v.weight ?? '',
          imageItems: Array.isArray(v.images)
            ? v.images.map((img, imgIdx) => ({
                file: null,
                previewUrl: img.image,
                isPrimary: img.is_primary || (!v.images.some(i => i.is_primary) && imgIdx === 0),
                id: img.id,
              }))
            : [],
          removedImageIds: [],
        })

        form.variants.push(variant)
      })
    }
    else {
      form.variants.push(createVariantObject({ _isDefault: true }))
    }

    activeVariantIndex.value = 0
    variantsToDelete.value = []

    form.variants.forEach(v => snapshotVariant(v))
    clearAllErrors()
  }
  finally {
    formLoading.value = false
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      void syncForm()
    }
  },
)

watch(
  () => props.product,
  () => {
    if (props.modelValue) {
      void syncForm()
    }
  },
  { deep: true },
)

onMounted(() => {
  void loadColors()
})

onBeforeUnmount(() => {
  form.variants.forEach((variant) => {
    variant.imageItems.forEach((item) => {
      if (item.file && item.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(item.previewUrl)
      }
    })
  })
  if (qrObjectUrl.value)
    URL.revokeObjectURL(qrObjectUrl.value)
})

const qrDialogOpen = ref(false)
const qrImageUrl = ref('')
const qrLoading = ref(false)
const qrObjectUrl = ref('')

async function showVariantQR(variant) {
  if (!variant._serverId)
    return
  qrLoading.value = true
  qrDialogOpen.value = true
  if (qrObjectUrl.value) {
    URL.revokeObjectURL(qrObjectUrl.value)
    qrObjectUrl.value = ''
  }
  qrImageUrl.value = ''
  try {
    const blob = await fetchProductVariantQR(variant._serverId)

    qrObjectUrl.value = URL.createObjectURL(blob)
    qrImageUrl.value = qrObjectUrl.value
  }
  catch {
    qrImageUrl.value = ''
  }
  finally {
    qrLoading.value = false
  }
}

function downloadQR() {
  if (!qrImageUrl.value)
    return
  const a = document.createElement('a')

  a.href = qrImageUrl.value
  a.download = 'qr-code.png'
  a.click()
}
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="860"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VCard>
      <VCardTitle class="text-h6">
        {{ isEditMode ? 'Edit Product' : 'Add Product' }}
      </VCardTitle>

      <VDivider />

      <VCardText>
        <!-- Skeleton Loading -->
        <template v-if="formLoading">
          <div class="skeleton-section mb-3">
            <div class="mb-4 flex items-center justify-between">
              <div>
                <div class="skeleton-text skeleton-text--title mb-1" />
                <div class="skeleton-text skeleton-text--subtitle" />
              </div>
              <div class="flex gap-3">
                <div class="skeleton-switch" />
                <div class="skeleton-switch" />
              </div>
            </div>
            <VRow>
              <VCol cols="12" md="6">
                <div class="skeleton-field" />
              </VCol>
              <VCol cols="12" md="6">
                <div class="skeleton-field" />
              </VCol>
              <VCol cols="12">
                <div class="skeleton-field skeleton-field--textarea" />
              </VCol>
            </VRow>
            <VDivider class="my-4" />
            <div class="mb-4 flex items-center justify-between">
              <div>
                <div class="skeleton-text skeleton-text--title mb-1" />
                <div class="skeleton-text skeleton-text--subtitle" />
              </div>
            </div>
            <VRow>
              <VCol cols="12" md="4">
                <div class="skeleton-field" />
              </VCol>
              <VCol cols="12" md="4">
                <div class="skeleton-field" />
              </VCol>
              <VCol cols="12" md="4">
                <div class="skeleton-field" />
              </VCol>
            </VRow>
          </div>

          <div class="skeleton-section mb-3">
            <div class="mb-4 flex items-center justify-between">
              <div>
                <div class="skeleton-text skeleton-text--title mb-1" />
                <div class="skeleton-text skeleton-text--subtitle" />
              </div>
              <div class="skeleton-btn" />
            </div>
            <div class="skeleton-variant-row mb-2" />
            <div class="skeleton-variant-row" />
          </div>
        </template>

        <!-- Actual Form -->
        <template v-else>
          <section class="mb-3 rounded-xl border border-[rgba(var(--v-theme-primary),0.14)] bg-[linear-gradient(180deg,rgba(var(--v-theme-surface),0.98),rgba(var(--v-theme-primary),0.02))] p-3 shadow-sm">
            <div class="mb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <div>
                <div class="text-sm font-semibold text-[rgb(var(--v-theme-on-surface))]">
                  Product Basic Information
                </div>
                <div class="text-xs text-medium-emphasis">
                  This data is saved for the product itself
                </div>
              </div>

              <div class="flex items-center gap-3">
                <VSwitch
                  v-model="form.is_active"
                  label="Active"
                  inset
                />

                <VSwitch
                  v-model="form.is_featured"
                  label="Featured"
                  inset
                />
              </div>
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
                  :error-messages="productFieldErrors.name"
                  @update:model-value="productFieldErrors.name = []"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VSelect
                  v-model="form.category"
                  :items="props.categories"
                  item-title="name"
                  item-value="id"
                  label="Category"
                  required
                  :error-messages="productFieldErrors.category"
                  @update:model-value="productFieldErrors.category = []"
                />
              </VCol>
              <VCol cols="12">
                <VTextarea
                  v-model="form.description"
                  label="Description"
                  rows="4"
                  :error-messages="productFieldErrors.description"
                  @update:model-value="productFieldErrors.description = []"
                />
              </VCol>
            </VRow>

            <VDivider class="my-4" />

            <div class="mb-3 flex items-start justify-between gap-3">
              <div>
                <div class="text-sm font-semibold text-[rgb(var(--v-theme-on-surface))]">
                  Commission Profile
                </div>
                <div class="text-xs text-medium-emphasis">
                  Default commission settings for all variants
                </div>
              </div>
              <div class="flex items-center gap-3 mb-4">
                <VSelect
                  v-model="form.product_fee_profile.fee_type"
                  :items="[
                    { title: 'Gold Percent', value: 'percent' },
                    { title: 'Fixed Amount (IRR)', value: 'fixed' },
                  ]"
                  item-title="title"
                  item-value="value"
                  label="Commission Type"
                  density="compact"
                  variant="outlined"
                  hide-details
                  class="flex-grow-0"
                  style="max-width: 180px;"
                />
                <VSwitch
                  v-model="form.product_fee_profile.is_active"
                  label="Active"
                  inset
                />
              </div>
            </div>

            <VRow class="mb-4">
              <VCol cols="12" md="4">
                <VTextField
                  v-model="form.product_fee_profile.base_fee"
                  v-persian-convert
                  label="Base Commission"
                  type="number"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model="form.product_fee_profile.base_weight"
                  v-persian-convert
                  label="Base Weight"
                  type="number"
                  inputmode="decimal"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model="form.product_fee_profile.base_quantity"
                  v-persian-convert
                  label="Base Quantity"
                  type="number"
                />
              </VCol>
            </VRow>

            <div class="rounded-xl border border-[rgba(var(--v-theme-primary),0.1)] bg-white/70 p-4 mb-3">
              <div class="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div class="text-sm font-semibold text-[rgb(var(--v-theme-on-surface))]">
                    Weight
                  </div>
                  <div class="text-xs text-medium-emphasis">
                    Enter the base weight only once. The weight of each card is calculated automatically.
                  </div>
                </div>
              </div>

              <VTabs v-model="weightOverrideTab" class="mb-4">
                <VTab value="fixed">
                  Fixed Weight
                </VTab>
                <VTab value="custom">
                  Custom Weight
                </VTab>
              </VTabs>

              <VWindow v-model="weightOverrideTab">
                <VWindowItem value="fixed">
                  <div dir="ltr" class="grid grid-cols-2 gap-3 lg:grid-cols-5">
                    <div
                      v-for="(field, woIndex) in weightOverrideMeta"
                      :key="field.label"
                      class="tier-card"
                    >
                      <div class="tier-label mb-3 text-xs font-medium text-medium-emphasis text-center">
                        {{ woIndex === 2 ? (form.product_fee_profile.base_weight || '—') : (Number(form.product_fee_profile.base_weight) * Number(form.product_fee_profile.weight_overrides[woIndex < 2 ? woIndex : woIndex - 1]?.multiplier) || '—') }} {{ field.label }}
                      </div>
                      <template v-if="woIndex !== 2">
                        <input
                          :value="form.product_fee_profile.weight_overrides[woIndex < 2 ? woIndex : woIndex - 1]?.fee_value"
                          type="number"
                          inputmode="decimal"
                          placeholder="Commission"
                          class="h-11 w-full rounded-2xl border border-[rgba(var(--v-theme-primary),0.16)] bg-white px-3 text-sm outline-none transition focus:border-[rgba(var(--v-theme-primary),0.6)] focus:shadow-[0_0_0_3px_rgba(105,108,255,0.1)]"
                          @input="updateProductWeightOverrideFee(woIndex < 2 ? woIndex : woIndex - 1, $event.target.value)"
                        >
                      </template>
                      <input
                        v-else
                        :value="form.product_fee_profile.base_fee"
                        type="number"
                        disabled
                        class="h-11 w-full rounded-2xl border border-[rgba(var(--v-theme-primary),0.16)] bg-white/60 px-3 text-sm outline-none transition opacity-70"
                      >
                    </div>
                  </div>
                </VWindowItem>

                <VWindowItem value="custom">
                  <div dir="ltr" class="space-y-3">
                    <div
                      v-for="(override, cwIndex) in form.product_fee_profile.custom_weight_overrides"
                      :key="`custom-${cwIndex}`"
                      class="flex items-end gap-3"
                    >
                      <div class="flex-1">
                        <label class="text-xs text-medium-emphasis mb-1 block">Weight</label>
                        <input
                          :value="override.weight"
                          type="number"
                          inputmode="decimal"
                          placeholder="Weight"
                          class="h-11 w-full rounded-2xl border border-[rgba(var(--v-theme-primary),0.16)] bg-white px-3 text-sm outline-none transition focus:border-[rgba(var(--v-theme-primary),0.6)] focus:shadow-[0_0_0_3px_rgba(105,108,255,0.1)]"
                          @input="updateProductCustomWeightOverrideWeight(cwIndex, $event.target.value)"
                        >
                      </div>
                      <div class="flex-1">
                        <label class="text-xs text-medium-emphasis mb-1 block">Commission</label>
                        <input
                          :value="override.fee_value"
                          type="number"
                          inputmode="decimal"
                          placeholder="Commission"
                          class="h-11 w-full rounded-2xl border border-[rgba(var(--v-theme-primary),0.16)] bg-white px-3 text-sm outline-none transition focus:border-[rgba(var(--v-theme-primary),0.6)] focus:shadow-[0_0_0_3px_rgba(105,108,255,0.1)]"
                          @input="updateProductCustomWeightOverrideFee(cwIndex, $event.target.value)"
                        >
                      </div>
                      <VBtn icon size="small" variant="text" color="error" @click="removeProductCustomWeightOverride(cwIndex)">
                        <VIcon icon="bx-trash" />
                      </VBtn>
                    </div>
                  </div>
                  <VBtn size="small" variant="tonal" color="primary" prepend-icon="bx-plus" class="mt-3" @click="addProductCustomWeightOverride">
                    Add Row
                  </VBtn>
                </VWindowItem>
              </VWindow>
            </div>

            <div class="rounded-xl border border-[rgba(var(--v-theme-primary),0.1)] bg-white/70 p-4">
              <div class="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div class="text-sm font-semibold text-[rgb(var(--v-theme-on-surface))]">
                    Quantity
                  </div>
                  <div class="text-xs text-medium-emphasis">
                    Enter all commission values manually from left to right
                  </div>
                </div>
              </div>
              <div dir="ltr" class="grid grid-cols-2 gap-3 lg:grid-cols-5">
                <div
                  v-for="(field, qtIndex) in quantityTierMeta"
                  :key="`${field.label}-quantity`"
                  class="space-y-2"
                >
                  <div class="text-xs font-medium text-medium-emphasis text-center">
                    {{ qtIndex === 0 ? (form.product_fee_profile.base_quantity || '—') : field.label }}
                  </div>
                  <template v-if="qtIndex !== 0">
                    <input
                      :value="form.product_fee_profile.quantity_tiers[qtIndex - 1]?.fee_value"
                      type="number"
                      inputmode="decimal"
                      placeholder="Commission"
                      class="h-11 w-full rounded-2xl border border-[rgba(var(--v-theme-primary),0.16)] bg-white px-3 text-sm outline-none transition focus:border-[rgba(var(--v-theme-primary),0.6)] focus:shadow-[0_0_0_3px_rgba(105,108,255,0.1)]"
                      @input="updateProductQuantityTierFee(qtIndex - 1, $event.target.value)"
                    >
                  </template>
                  <input
                    v-else
                    :value="form.product_fee_profile.base_fee"
                    type="number"
                    disabled
                    class="h-11 w-full rounded-2xl border border-[rgba(var(--v-theme-primary),0.16)] bg-white/60 px-3 text-sm outline-none transition opacity-70"
                  >
                </div>
              </div>
            </div>
          </section>

          <VAlert
            v-if="productError"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-4"
            closable
            @click:close="productError = ''"
          >
            {{ productError }}
          </VAlert>

          <VAlert
            v-if="sectionError"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-4"
            closable
            @click:close="sectionError = ''"
          >
            {{ sectionError }}
          </VAlert>

          <!-- Variant Table -->
          <div class="mb-5 rounded-3xl border border-[rgba(var(--v-theme-primary),0.14)] bg-[linear-gradient(180deg,rgba(var(--v-theme-surface),0.98),rgba(var(--v-theme-primary),0.02))] p-5 shadow-sm">
            <div class="mb-4 flex items-center justify-between gap-3">
              <div>
                <div class="text-sm font-semibold text-[rgb(var(--v-theme-on-surface))]">
                  Product Variants
                </div>
                <div class="text-xs text-medium-emphasis">
                  Enter information for each variant in one row
                </div>
              </div>
              <VBtn size="small" color="primary" variant="tonal" prepend-icon="bx-plus" @click="addVariant">
                Add Variant
              </VBtn>
            </div>

            <input
              ref="variantImageInput"
              type="file"
              accept="image/*"
              multiple
              class="hidden"
              @change="handleVariantImageChange"
            >

            <div
              v-for="(variant, index) in form.variants"
              :key="variant._key"
              class="mb-3 rounded-2xl border border-[rgba(var(--v-theme-primary),0.12)] bg-white/60 p-3"
            >
              <div class="flex items-center gap-2" dir="rtl">
                <!-- Remove button -->
                <VBtn
                  v-if="!variant._isDefault"
                  icon
                  size="x-small"
                  variant="text"
                  color="error"
                  @click="removeVariant(index)"
                >
                  <VIcon icon="bx-x" size="18" />
                </VBtn>
                <div v-else style="width: 28px;" />

                <!-- Image -->
                <div
                  style="min-width: 60px; cursor: pointer;"
                  @click="openImageModal(variant)"
                >
                  <div v-if="variant.imageItems.length > 0" class="flex gap-0.5">
                    <div
                      v-for="(item, imgIndex) in variant.imageItems.slice(0, 2)"
                      :key="imgIndex"
                      class="relative rounded overflow-hidden"
                      style="width: 28px; height: 28px;"
                      :class="item.isPrimary ? 'ring-2 ring-primary' : ''"
                    >
                      <img :src="item.previewUrl" class="w-full h-full object-cover">
                    </div>
                    <div v-if="variant.imageItems.length > 2" class="flex items-center justify-center text-[10px] text-medium-emphasis rounded bg-grey-lighten-4" style="width: 28px; height: 28px;">
                      +{{ variant.imageItems.length - 2 }}
                    </div>
                  </div>
                  <VBtn
                    v-else
                    size="x-small"
                    color="grey"
                    variant="tonal"
                    icon="bx-image-add"
                  />
                </div>

                <!-- Color (VSelect with swatches) -->
                <div style="min-width: 120px; max-width: 160px; flex: 1;">
                  <VSelect
                    :model-value="variant.color_ids"
                    :items="colorSwatches"
                    item-title="label"
                    item-value="id"
                    label="Color"
                    density="compact"
                    variant="outlined"
                    hide-details
                    multiple
                    chips
                    closable-chips
                    @update:model-value="variant.color_ids = $event"
                  >
                    <template #chip="{ props: chipProps, item }">
                      <VChip
                        v-bind="chipProps"
                        size="small"
                        closable
                      >
                        <template #prepend>
                          <span
                            class="rounded-full me-1"
                            style="width: 10px; height: 10px; display: inline-block; background-color: rgba(var(--v-theme-on-surface), 0.87);"
                            :style="{ backgroundColor: item.raw.color }"
                          />
                        </template>
                        {{ item.raw.label }}
                      </VChip>
                    </template>
                    <template #item="{ props: itemProps, item }">
                      <VListItem v-bind="itemProps">
                        <template #prepend>
                          <span
                            class="rounded-full me-3"
                            style="width: 14px; height: 14px; display: inline-block; border: 1px solid rgba(0,0,0,0.1);"
                            :style="{ backgroundColor: item.raw.color }"
                          />
                        </template>
                      </VListItem>
                    </template>
                  </VSelect>
                  <p v-if="getVariantErrors(variant).variant.color_ids.length" class="mt-0.5 text-[10px] text-error">
                    {{ getVariantErrors(variant).variant.color_ids.join(', ') }}
                  </p>
                </div>

                <!-- SKU -->
                <div style="min-width: 100px; flex: 1;">
                  <VTextField
                    v-model="variant.sku"
                    v-persian-convert
                    label="SKU"
                    density="compact"
                    variant="outlined"
                    hide-details
                    :error-messages="getVariantErrors(variant).variant.sku"
                    @update:model-value="getVariantErrors(variant).variant.sku = []"
                  />
                </div>

                <!-- Fee -->
                <div style="min-width: 90px; flex: 1;">
                  <VTextField
                    v-model="variant.fee"
                    v-persian-convert
                    label="Commission"
                    density="compact"
                    variant="outlined"
                    hide-details
                    type="number"
                    :error-messages="getVariantErrors(variant).variant.fee"
                    @update:model-value="getVariantErrors(variant).variant.fee = []"
                  />
                </div>

                <!-- Fee Type -->
                <div style="min-width: 80px;">
                  <VSelect
                    v-model="variant.fee_type"
                    :items="[
                      { title: 'IRR', value: 'fixed' },
                      { title: 'Percent', value: 'percent' },
                    ]"
                    item-title="title"
                    item-value="value"
                    density="compact"
                    variant="outlined"
                    hide-details
                  />
                </div>

                <!-- Weight -->
                <div style="min-width: 80px; flex: 1;">
                  <VTextField
                    v-model="variant.weight"
                    v-persian-convert
                    label="Weight (g)"
                    density="compact"
                    variant="outlined"
                    hide-details
                    type="number"
                    inputmode="decimal"
                    :error-messages="getVariantErrors(variant).variant.weight"
                    @update:model-value="getVariantErrors(variant).variant.weight = []"
                  />
                </div>

                <!-- QR Code -->
                <VBtn
                  v-if="!variant._isNew && variant._serverId"
                  icon
                  size="x-small"
                  variant="text"
                  color="primary"
                  title="QR Code"
                  @click="showVariantQR(variant)"
                >
                  <VIcon icon="bx-qr" size="18" />
                </VBtn>
              </div>
            </div>

            <VBtn
              block
              variant="outlined"
              color="primary"
              prepend-icon="bx-plus"
              @click="addVariant"
            >
              Add New Variant
            </VBtn>
          </div>

          <ProductColorFormDialog
            v-model="colorDialogOpen"
            :color="selectedColor"
            @save="handleColorSave"
          />

          <!-- Image Management Modal -->
          <VDialog
            v-model="imageModalOpen"
            max-width="700"
          >
            <VCard v-if="imageModalVariant">
              <VCardTitle class="d-flex align-center justify-space-between pa-4">
                <span class="text-h6">Variant Image Management</span>
                <VBtn icon size="small" variant="text" @click="imageModalOpen = false">
                  <VIcon icon="bx-x" />
                </VBtn>
              </VCardTitle>

              <VDivider />

              <VCardText>
                <!-- Main Preview -->
                <div
                  v-if="imageModalVariant.imageItems.length > 0"
                  class="mb-4 rounded-lg overflow-hidden bg-grey-lighten-4 d-flex align-center justify-center"
                  style="height: 320px;"
                >
                  <img
                    :src="imageModalVariant.imageItems[imageModalIndex]?.previewUrl"
                    style="max-width: 100%; max-height: 100%; object-fit: contain;"
                  >
                </div>
                <div
                  v-else
                  class="mb-4 rounded-lg border-2 border-dashed border-grey d-flex align-center justify-center"
                  style="height: 320px;"
                >
                  <div class="text-center text-medium-emphasis">
                    <VIcon icon="bx-image" size="48" color="grey" />
                    <div class="mt-2">
                      No image available
                    </div>
                  </div>
                </div>

                <!-- Thumbnails -->
                <div class="d-flex gap-2 flex-wrap mb-4">
                  <div
                    v-for="(item, imgIndex) in imageModalVariant.imageItems"
                    :key="imgIndex"
                    class="relative rounded-lg overflow-hidden cursor-pointer transition-all"
                    :class="imgIndex === imageModalIndex ? 'ring-2 ring-primary' : 'ring-1 ring-grey-lighten-2'"
                    style="width: 72px; height: 72px;"
                    @click="imageModalIndex = imgIndex"
                  >
                    <img :src="item.previewUrl" class="w-full h-full object-cover">
                    <div
                      v-if="item.isPrimary"
                      class="position-absolute d-flex align-center justify-center text-white text-xs font-weight-bold px-1 rounded-pill"
                      style="bottom: 2px; right: 2px; background: rgb(var(--v-theme-primary)); line-height: 1.4; font-size: 9px;"
                    >
                      Primary
                    </div>
                  </div>
                </div>

                <!-- Actions -->
                <div v-if="imageModalVariant.imageItems.length > 0" class="d-flex gap-2 flex-wrap">
                  <VBtn
                    size="small"
                    variant="tonal"
                    color="primary"
                    prepend-icon="bx-check-circle"
                    :disabled="imageModalVariant.imageItems[imageModalIndex]?.isPrimary"
                    @click="imageModalSetPrimary(imageModalIndex)"
                  >
                    Set as Primary
                  </VBtn>
                  <VBtn
                    size="small"
                    variant="tonal"
                    color="error"
                    prepend-icon="bx-trash"
                    @click="imageModalRemove(imageModalIndex)"
                  >
                    Delete Image
                  </VBtn>
                  <VSpacer />
                  <VBtn
                    size="small"
                    variant="tonal"
                    color="primary"
                    prepend-icon="bx-plus"
                    @click="imageModalAdd"
                  >
                    Add Image
                  </VBtn>
                </div>
                <div v-else class="d-flex justify-center">
                  <VBtn
                    size="small"
                    variant="tonal"
                    color="primary"
                    prepend-icon="bx-plus"
                    @click="imageModalAdd"
                  >
                    Add Image
                  </VBtn>
                </div>
              </VCardText>
            </VCard>
          </VDialog>

          <!-- QR Code Dialog -->
          <VDialog v-model="qrDialogOpen" max-width="360">
            <VCard>
              <VCardTitle class="d-flex align-center justify-space-between text-body-1 pa-4">
                <span>Variant QR Code</span>
                <VBtn icon size="small" variant="text" @click="qrDialogOpen = false">
                  <VIcon icon="bx-x" />
                </VBtn>
              </VCardTitle>
              <VDivider />
              <VCardText class="d-flex flex-column align-center pa-6">
                <div v-if="qrLoading" class="py-6">
                  <VProgressCircular indeterminate color="primary" width="3" size="40" />
                </div>
                <template v-else-if="qrImageUrl">
                  <img :src="qrImageUrl" class="rounded-lg border mb-4" style="max-width: 240px; width: 100%;">
                  <VBtn block variant="tonal" color="primary" prepend-icon="bx-download" @click="downloadQR">
                    Download
                  </VBtn>
                </template>
                <div v-else class="text-medium-emphasis text-body-2 py-4">
                  Unable to retrieve QR code.
                </div>
              </VCardText>
            </VCard>
          </VDialog>
        </template>
      </VCardText>

      <VDivider />

      <VCardActions class="justify-end gap-2">
        <VBtn
          variant="text"
          :disabled="submitting"
          @click="emit('update:modelValue', false)"
        >
          Cancel
        </VBtn>
        <VBtn
          color="primary"
          :loading="submitting"
          @click="submit"
        >
          Save
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.tier-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
}

.tier-label {
  display: block;
  white-space: nowrap;
  line-height: 1.2;
  font-size: 0.72rem;
  letter-spacing: -0.01em;
  text-align: center;
  width: 100%;
}

.image-thumb:hover {
  border-color: rgba(var(--v-theme-primary), 0.3) !important;
}

/* Skeleton loading */
@keyframes skeleton-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

.skeleton-section {
  animation: skeleton-pulse 1.8s ease-in-out infinite;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
  padding: 16px;
}

.skeleton-text {
  border-radius: 6px;
  background: rgba(var(--v-theme-on-surface), 0.08);
}

.skeleton-text--title {
  width: 140px;
  height: 14px;
}

.skeleton-text--subtitle {
  width: 220px;
  height: 10px;
}

.skeleton-switch {
  width: 48px;
  height: 24px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.08);
}

.skeleton-field {
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  height: 52px;
  width: 100%;
}

.skeleton-field--textarea {
  height: 100px;
}

.skeleton-btn {
  width: 100px;
  height: 32px;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.06);
}

.skeleton-variant-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid rgba(var(--v-theme-primary), 0.08);
  background: rgba(var(--v-theme-on-surface), 0.02);
  height: 48px;
}

.skeleton-variant-row::before {
  content: '';
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: rgba(var(--v-theme-on-surface), 0.08);
  flex-shrink: 0;
}

.skeleton-variant-row::after {
  content: '';
  flex: 1;
  height: 28px;
  border-radius: 6px;
  background: rgba(var(--v-theme-on-surface), 0.06);
}
</style>

import { ref } from 'vue'
import {
  createProduct,
  createProductVariant,
  deleteProductVariant,
  updateProduct,
  updateProductVariant,
} from '@/services/products'

export function useProductFormSubmit({
  form,
  getProduct,
  buildVariantFormDataForVariant,
  syncImageIdsFromResponse,
  extractProductFieldErrors,
  extractVariantFieldErrors,
  getVariantErrors,
  productError,
  sectionError,
  emit,
}) {
  const submitting = ref(false)
  let savedProductState = null
  const variantsToDelete = ref([])
  const variantSnapshots = {}

  function resetSubmitState() {
    savedProductState = null
    variantsToDelete.value = []
  }

  function snapshotProductFeeProfile() {
    if (savedProductState) {
      savedProductState.product_fee_profile_snapshot = JSON.parse(JSON.stringify(form.product_fee_profile))
    }
  }

  function snapshotVariant(variant) {
    const primaryItem = variant.imageItems?.find(item => item.isPrimary)

    variantSnapshots[variant._key] = {
      sku: variant.sku || '',
      fee: variant.fee ?? '',
      feeType: variant.fee_type ?? 'fixed',
      weight: variant.weight ?? '',
      colorIds: JSON.stringify([...(variant.color_ids || [])].sort()),
      imageCount: variant.imageItems?.length || 0,
      primaryImageId: primaryItem?.id || null,
      removedImageCount: variant.removedImageIds?.length || 0,
    }
  }

  function hasVariantChanged(variant) {
    const snap = variantSnapshots[variant._key]
    if (!snap)
      return true

    const currentSku = variant.sku || ''
    const currentFee = variant.fee ?? ''
    const currentFeeType = variant.fee_type ?? 'fixed'
    const currentWeight = variant.weight ?? ''
    const currentColorIds = JSON.stringify([...(variant.color_ids || [])].sort())
    const currentImageCount = variant.imageItems?.length || 0
    const primaryItem = variant.imageItems?.find(item => item.isPrimary)
    const currentPrimaryId = primaryItem?.id || null
    const currentRemovedCount = variant.removedImageIds?.length || 0

    return (
      currentSku !== snap.sku
      || currentFee !== snap.fee
      || currentFeeType !== snap.feeType
      || currentWeight !== snap.weight
      || currentColorIds !== snap.colorIds
      || currentImageCount !== snap.imageCount
      || currentPrimaryId !== snap.primaryImageId
      || currentRemovedCount !== snap.removedImageCount
    )
  }

  function hasFeeChanged() {
    return JSON.stringify(form.product_fee_profile) !== JSON.stringify(savedProductState?.product_fee_profile_snapshot)
  }

  function buildFeePayload() {
    const fee = form.product_fee_profile

    return {
      fee_type: fee.fee_type,
      base_fee: Number(fee.base_fee) || 0,
      base_weight: String(fee.base_weight || ''),
      base_quantity: Number(fee.base_quantity) || 1,
      is_active: fee.is_active ?? true,
      weight_overrides: [
        ...fee.weight_overrides
          .filter(o => o.fee_value !== '')
          .map(o => ({ rule_type: 'multiplier', multiplier: Number(o.multiplier).toFixed(2), fee_type: fee.fee_type, fee_value: Number(o.fee_value) })),
        ...fee.custom_weight_overrides
          .filter(o => o.weight !== '' && o.fee_value !== '')
          .map(o => ({ rule_type: 'exact_weight', exact_weight: String(o.weight), fee_type: fee.fee_type, fee_value: Number(o.fee_value) })),
      ],
      quantity_tiers: fee.quantity_tiers
        .filter(t => t.fee_value !== '')
        .map(t => ({
          min_quantity: t.min_quantity !== null && t.min_quantity !== '' ? Number(t.min_quantity) : null,
          fee_type: fee.fee_type,
          fee_value: Number(t.fee_value),
        })),
    }
  }

  async function submit() {
    productError.value = ''
    sectionError.value = ''
    submitting.value = true

    try {
      const currentProduct = getProduct()
      const payload = {}

      if (form.name)
        payload.name = form.name
      if (form.category)
        payload.category = Number(form.category)
      if (form.description)
        payload.description = form.description
      payload.is_active = form.is_active
      payload.is_featured = form.is_featured

      // Include fee profile in product payload
      if (hasFeeChanged()) {
        payload.product_fee_profile = buildFeePayload()
      }

      let savedProduct

      try {
        if (savedProductState?.slug) {
          savedProduct = await updateProduct(savedProductState.slug, payload)
        }
        else if (currentProduct?.slug) {
          savedProduct = await updateProduct(currentProduct.slug, payload)
        }
        else {
          savedProduct = await createProduct(payload)
          savedProductState = savedProduct
        }
        snapshotProductFeeProfile()
      }
      catch (e) {
        const data = e?.response?.data

        if (!extractProductFieldErrors(data)) {
          productError.value = data?.detail || (typeof data === 'string' ? data : '') || 'Error saving product basic information'
        }

        return
      }

      const productId = savedProduct?.id || currentProduct?.id
      const apiDefaultVariant = savedProduct?.variants?.[0] || null

      for (let i = 0; i < form.variants.length; i++) {
        const variant = form.variants[i]

        try {
          let serverVariant

          if (variant._isNew) {
            if (i === 0 && apiDefaultVariant) {
              variant._serverId = apiDefaultVariant.id
              variant._isNew = false

              if (hasVariantChanged(variant)) {
                const formData = buildVariantFormDataForVariant(productId, variant, { includeImages: true, includePrimaryId: true })

                serverVariant = await updateProductVariant(variant._serverId, formData)
                syncImageIdsFromResponse(variant, serverVariant?.images)
              }
            }
            else {
              const formData = buildVariantFormDataForVariant(productId, variant)

              serverVariant = await createProductVariant(formData)
              variant._serverId = serverVariant.id
              variant._isNew = false
              syncImageIdsFromResponse(variant, serverVariant?.images)
            }
          }
          else if (hasVariantChanged(variant)) {
            const hasNewImages = variant.imageItems.some(item => !item.id && item.file)
            const primaryItem = variant.imageItems.find(item => item.isPrimary)
            const primaryNeedsUpload = hasNewImages && !primaryItem?.id

            if (primaryNeedsUpload) {
              const formData1 = buildVariantFormDataForVariant(productId, variant, { includeImages: true, includePrimaryId: false })

              serverVariant = await updateProductVariant(variant._serverId, formData1)
              syncImageIdsFromResponse(variant, serverVariant?.images)

              const formData2 = buildVariantFormDataForVariant(productId, variant, { includeImages: false, includePrimaryId: true })

              await updateProductVariant(variant._serverId, formData2)
            }
            else {
              const formData = buildVariantFormDataForVariant(productId, variant, { includeImages: true, includePrimaryId: true })

              serverVariant = await updateProductVariant(variant._serverId, formData)
              syncImageIdsFromResponse(variant, serverVariant?.images)
            }
          }
        }
        catch (e) {
          const data = e?.response?.data

          const variantApplied = extractVariantFieldErrors(data, variant)

          if (!variantApplied) {
            sectionError.value = data?.detail || (typeof data === 'string' ? data : '') || `Error saving variant ${i + 1}`
          }

          return
        }
      }

      for (const variantId of variantsToDelete.value) {
        try {
          await deleteProductVariant(variantId)
        }
        catch (e) {
          console.error('Failed to delete variant', e)
        }
      }

      savedProductState = null
      variantsToDelete.value = []

      emit('save')
      emit('update:modelValue', false)
    }
    finally {
      submitting.value = false
    }
  }

  return {
    submitting,
    submit,
    resetSubmitState,
    snapshotVariant,
    variantsToDelete,
  }
}

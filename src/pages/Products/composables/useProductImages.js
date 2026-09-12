import { ref } from 'vue'
import { processImageForUpload } from '@/utils/imageOptimizer'

export function useProductImages(activeVariant) {
  const variantImageInput = ref(null)
  const isProcessingImages = ref(false)
  const pendingImageVariant = ref(null)

  function triggerVariantImagePicker(targetVariant) {
    pendingImageVariant.value = targetVariant || activeVariant.value
    variantImageInput.value?.click()
  }

  async function handleVariantImageChange(event) {
    const files = Array.from(event?.target?.files || [])
    if (files.length === 0)
      return

    const variant = pendingImageVariant.value || activeVariant.value

    isProcessingImages.value = true

    try {
      const newItems = []
      for (const file of files) {
        try {
          const { file: optimizedFile } = await processImageForUpload(file)

          newItems.push({
            file: optimizedFile,
            previewUrl: URL.createObjectURL(optimizedFile),
            isPrimary: false,
            id: null,
          })
        }
        catch {
          newItems.push({
            file,
            previewUrl: URL.createObjectURL(file),
            isPrimary: false,
            id: null,
          })
        }
      }

      if (variant.imageItems.length === 0 && newItems.length > 0) {
        newItems[0].isPrimary = true
      }
      variant.imageItems.push(...newItems)
    }
    finally {
      isProcessingImages.value = false
    }

    if (variantImageInput.value) {
      variantImageInput.value.value = ''
    }
  }

  function setPrimaryImage(index, targetVariant) {
    const variant = targetVariant || activeVariant.value

    variant.imageItems.forEach((item) => { item.isPrimary = false })
    variant.imageItems[index].isPrimary = true
  }

  function removeImageItem(index, targetVariant) {
    const variant = targetVariant || activeVariant.value
    const item = variant.imageItems[index]
    if (item.file && item.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(item.previewUrl)
    }
    if (item.id) {
      variant.removedImageIds.push(item.id)
    }
    const wasPrimary = item.isPrimary

    variant.imageItems.splice(index, 1)
    if (wasPrimary && variant.imageItems.length > 0) {
      variant.imageItems[0].isPrimary = true
    }
  }

  function buildVariantFormData(productId, variant, { includeImages = true, includePrimaryId = false } = {}) {
    const formData = new FormData()

    formData.append('product', `${productId}`)

    if (variant.sku)
      formData.append('sku', variant.sku)
    formData.append('fee', String(variant.fee ?? ''))
    formData.append('fee_type', variant.fee_type ?? 'fixed')
    formData.append('weight', String(variant.weight ?? ''))

    if (variant.color_ids.length > 0) {
      variant.color_ids.forEach(id => formData.append('color_ids', `${Number(id)}`))
    }

    if (includeImages) {
      const notYetUploaded = variant.imageItems.filter(item => !item.id && item.file)

      notYetUploaded.forEach(item => formData.append('image_files', item.file))
      variant.removedImageIds.forEach(id => formData.append('removed_image_ids', `${id}`))
    }
    else {
      variant.removedImageIds.forEach(id => formData.append('removed_image_ids', `${id}`))
    }

    if (includePrimaryId) {
      const primaryItem = variant.imageItems.find(item => item.isPrimary)
      if (primaryItem?.id) {
        formData.append('primary_image_id', `${primaryItem.id}`)
      }
    }

    return formData
  }

  function syncImageIdsFromResponse(variant, serverImages) {
    if (!Array.isArray(serverImages) || serverImages.length === 0)
      return

    const serverByUrl = new Map(serverImages.map(img => [img.image, img]))
    const usedServerIds = new Set()

    variant.imageItems.forEach((item) => {
      if (item.id) {
        usedServerIds.add(item.id)

        return
      }

      let match = serverByUrl.get(item.previewUrl)
      if (match && !usedServerIds.has(match.id)) {
        item.id = match.id
        item.previewUrl = match.image
        usedServerIds.add(match.id)

        return
      }

      match = serverImages.find(img => !usedServerIds.has(img.id))
      if (match) {
        item.id = match.id
        item.previewUrl = match.image
        usedServerIds.add(match.id)
      }
    })
  }

  function resetRemovedImages(variant) {
    variant.removedImageIds = []
  }

  return {
    variantImageInput,
    isProcessingImages,
    triggerVariantImagePicker,
    handleVariantImageChange,
    setPrimaryImage,
    removeImageItem,
    buildVariantFormData,
    syncImageIdsFromResponse,
    resetRemovedImages,
  }
}

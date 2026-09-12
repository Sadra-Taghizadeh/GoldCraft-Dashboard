import { ref } from 'vue'
import { createProductColor, fetchProductColors } from '@/services/products'

export function useProductColors(activeVariant) {
  const colorSwatches = ref([])
  const colorDialogOpen = ref(false)
  const selectedColor = ref(null)

  async function loadColors() {
    try {
      const data = await fetchProductColors()

      colorSwatches.value = Array.isArray(data)
        ? data.map(c => ({ id: c.id, label: c.name, color: c.code || c.color || 'transparent' }))
        : []
    }
    catch (e) {
      console.error('Failed to load product colors', e)
      colorSwatches.value = []
    }
  }

  function selectColor(swatch, targetVariant) {
    const v = targetVariant || activeVariant.value
    const ids = v.color_ids
    const index = ids.indexOf(swatch.id)
    if (index === -1) {
      ids.push(swatch.id)
    }
    else {
      ids.splice(index, 1)
    }
  }

  function addColor() {
    selectedColor.value = null
    colorDialogOpen.value = true
  }

  async function handleColorSave(payload) {
    try {
      const created = await createProductColor(payload)
      const sw = { id: created.id, label: created.name, color: created.code || created.color || 'transparent' }

      colorSwatches.value.push(sw)
      selectColor(sw)
      colorDialogOpen.value = false
      selectedColor.value = null
    }
    catch (e) {
      console.error('Failed to create color', e)
    }
  }

  return {
    colorSwatches,
    colorDialogOpen,
    selectedColor,
    loadColors,
    selectColor,
    addColor,
    handleColorSave,
  }
}

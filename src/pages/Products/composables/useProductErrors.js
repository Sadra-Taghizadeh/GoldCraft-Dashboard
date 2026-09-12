import { reactive, ref } from 'vue'
import { translateMessages } from '@/pages/Products/utils/translateErrors'

export function useProductErrors() {
  const productError = ref('')
  const sectionError = ref('')

  const productFieldErrors = reactive({
    name: [],
    category: [],
    description: [],
  })

  const productFeeErrors = reactive({
    base_fee: [],
    base_weight: [],
    base_quantity: [],
    is_active: [],
    weight_overrides_fee_value: [],
    custom_weight_overrides_weight: [],
    custom_weight_overrides_fee_value: [],
    quantity_tiers_fee_value: [],
  })

  function getVariantErrors(variant) {
    if (!variant._errors) {
      variant._errors = reactive({
        variant: { sku: [], fee: [], fee_type: [], weight: [], color_ids: [] },
        fee: {
          base_fee: [],
          base_weight: [],
          base_quantity: [],
          is_active: [],
          weight_overrides_fee_value: [],
          custom_weight_overrides_weight: [],
          custom_weight_overrides_fee_value: [],
          quantity_tiers_fee_value: [],
        },
      })
    }

    return variant._errors
  }

  function extractProductFieldErrors(data) {
    if (!data || typeof data !== 'object')
      return false

    let applied = false
    if (Array.isArray(data.name)) {
      productFieldErrors.name = translateMessages(data.name)
      applied = true
    }
    if (Array.isArray(data.category)) {
      productFieldErrors.category = translateMessages(data.category)
      applied = true
    }
    if (Array.isArray(data.description)) {
      productFieldErrors.description = translateMessages(data.description)
      applied = true
    }

    return applied
  }

  function extractVariantFieldErrors(data, variant) {
    if (!data || typeof data !== 'object' || data.detail)
      return false
    if (!variant)
      return false

    const errs = getVariantErrors(variant).variant
    let applied = false
    if (Array.isArray(data.sku)) {
      errs.sku = translateMessages(data.sku)
      applied = true
    }
    if (Array.isArray(data.fee)) {
      errs.fee = translateMessages(data.fee)
      applied = true
    }
    if (Array.isArray(data.fee_type)) {
      errs.fee_type = translateMessages(data.fee_type)
      applied = true
    }
    if (Array.isArray(data.weight)) {
      errs.weight = translateMessages(data.weight)
      applied = true
    }
    if (Array.isArray(data.color_ids)) {
      errs.color_ids = translateMessages(data.color_ids)
      applied = true
    }

    return applied
  }

  function extractFeeFieldErrors(data, variant) {
    if (!data || typeof data !== 'object' || data.detail)
      return false

    const errs = variant ? getVariantErrors(variant).fee : productFeeErrors
    let applied = false
    if (Array.isArray(data.base_fee)) {
      errs.base_fee = translateMessages(data.base_fee)
      applied = true
    }
    if (Array.isArray(data.base_weight)) {
      errs.base_weight = translateMessages(data.base_weight)
      applied = true
    }
    if (Array.isArray(data.base_quantity)) {
      errs.base_quantity = translateMessages(data.base_quantity)
      applied = true
    }
    if (Array.isArray(data.is_active)) {
      errs.is_active = translateMessages(data.is_active)
      applied = true
    }

    if (Array.isArray(data.weight_overrides)) {
      errs.weight_overrides_fee_value = data.weight_overrides.map((entry) => {
        if (entry && Array.isArray(entry.fee_value))
          return translateMessages(entry.fee_value)
        if (typeof entry === 'string')
          return translateMessages([entry])

        return []
      })
      applied = true
    }
    if (Array.isArray(data.quantity_tiers)) {
      errs.quantity_tiers_fee_value = data.quantity_tiers.map((entry) => {
        if (entry && Array.isArray(entry.fee_value))
          return translateMessages(entry.fee_value)
        if (typeof entry === 'string')
          return translateMessages([entry])

        return []
      })
      applied = true
    }
    if (Array.isArray(data.custom_weight_overrides)) {
      errs.custom_weight_overrides_weight = data.custom_weight_overrides.map((entry) => {
        if (entry && Array.isArray(entry.weight))
          return translateMessages(entry.weight)
        if (typeof entry === 'string')
          return translateMessages([entry])

        return []
      })
      errs.custom_weight_overrides_fee_value = data.custom_weight_overrides.map((entry) => {
        if (entry && Array.isArray(entry.fee_value))
          return translateMessages(entry.fee_value)
        if (typeof entry === 'string')
          return translateMessages([entry])

        return []
      })
      applied = true
    }

    return applied
  }

  function clearAllErrors() {
    productError.value = ''
    sectionError.value = ''

    productFieldErrors.name = []
    productFieldErrors.category = []
    productFieldErrors.description = []

    productFeeErrors.base_fee = []
    productFeeErrors.base_weight = []
    productFeeErrors.base_quantity = []
    productFeeErrors.is_active = []
    productFeeErrors.weight_overrides_fee_value = []
    productFeeErrors.custom_weight_overrides_weight = []
    productFeeErrors.custom_weight_overrides_fee_value = []
    productFeeErrors.quantity_tiers_fee_value = []
  }

  return {
    productError,
    sectionError,
    productFieldErrors,
    productFeeErrors,
    getVariantErrors,
    extractProductFieldErrors,
    extractVariantFieldErrors,
    extractFeeFieldErrors,
    clearAllErrors,
  }
}

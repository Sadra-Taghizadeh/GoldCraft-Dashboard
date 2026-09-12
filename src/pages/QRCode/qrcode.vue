<script setup>
import TableCardToolbar from '@/components/shared/TableCardToolbar.vue'
import { fetchProductVariantQR, fetchProductVariants } from '@/services/products'

const variants = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const qrDialogOpen = ref(false)
const qrImageUrl = ref('')
const selectedVariant = ref(null)
const qrPrintArea = ref(null)

const filters = ref({
  search: '',
})

const normalizeText = value => `${value ?? ''}`.trim().toLowerCase()

const filteredVariants = computed(() => {
  const search = normalizeText(filters.value.search)

  return variants.value.filter((variant) => {
    if (!search)
      return true

    const colorNames = variant.colors?.map(c => c.name).join(' ') || ''

    return [variant.product_name, variant.sku, colorNames]
      .some(value => normalizeText(value).includes(search))
  })
})

async function loadVariants() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await fetchProductVariants()

    variants.value = Array.isArray(response.results) ? response.results : Array.isArray(response) ? response : []
  }
  catch (error) {
    variants.value = []
    errorMessage.value = error?.response?.data?.detail || 'Unable to load items.'
  }
  finally {
    isLoading.value = false
  }
}

async function showQR(variant) {
  try {
    selectedVariant.value = variant

    const blob = await fetchProductVariantQR(variant.id)
    const url = URL.createObjectURL(blob)

    qrImageUrl.value = url
    qrDialogOpen.value = true
  }
  catch (error) {
    errorMessage.value = error?.response?.data?.detail || 'Unable to fetch QR code.'
  }
}

function printQR() {
  const area = qrPrintArea.value
  if (!area)
    return

  const printWindow = window.open('', '_blank', 'width=400,height=400')

  printWindow.document.write(`
    <html>
      <head><title>QR Code - ${selectedVariant.value?.sku || ''}</title></head>
      <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;">
        <img src="${qrImageUrl.value}" style="width:250px;height:250px;" />
        <p style="margin-top:16px;font-size:14px;">${selectedVariant.value?.sku || ''}</p>
      </body>
    </html>
  `)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}

function downloadQRFile() {
  if (!qrImageUrl.value)
    return

  const link = document.createElement('a')

  link.href = qrImageUrl.value
  link.download = `qr-${selectedVariant.value?.sku || 'variant'}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

onMounted(() => {
  loadVariants()
})
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <TableCardToolbar
          v-model:search="filters.search"
          :title="`QR Codes (${filteredVariants.length})`"
          search-placeholder="Product name, SKU, color"
          search-label="Search"
        >
          <template #actions>
            <VBtn
              variant="text"
              icon="bx-refresh"
              @click="loadVariants"
            />
          </template>
        </TableCardToolbar>

        <VDivider />

        <VCardText>
          <VAlert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            class="mb-4"
            closable
            @click:close="errorMessage = ''"
          >
            {{ errorMessage }}
          </VAlert>

          <div
            v-if="isLoading && filteredVariants.length === 0"
            class="d-flex justify-center py-6"
          >
            <VProgressCircular
              indeterminate
              color="primary"
            />
          </div>

          <VTable
            v-else
            class="text-no-wrap"
          >
            <thead>
              <tr>
                <th class="text-uppercase text-center">
                  Product Name
                </th>
                <th class="text-uppercase text-center">
                  SKU
                </th>
                <th class="text-uppercase text-center">
                  Colors
                </th>
                <th class="text-uppercase text-end">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredVariants.length === 0">
                <td
                  colspan="4"
                  class="text-center text-medium-emphasis py-6"
                >
                  No variants found.
                </td>
              </tr>
              <tr
                v-for="variant in filteredVariants"
                :key="variant.id"
              >
                <td class="text-center">
                  {{ variant.product_name || '—' }}
                </td>
                <td class="text-center">
                  <code class="text-caption">{{ variant.sku || '—' }}</code>
                </td>
                <td class="text-center">
                  <div class="d-flex gap-1 flex-wrap justify-center">
                    <VChip
                      v-for="color in variant.colors"
                      :key="color.id"
                      size="small"
                      label
                      variant="tonal"
                    >
                      <template #prepend>
                        <span
                          class="color-dot me-1"
                          :style="{ backgroundColor: color.code }"
                        />
                      </template>
                      {{ color.name }}
                    </VChip>
                    <span
                      v-if="!variant.colors?.length"
                      class="text-medium-emphasis"
                    >—</span>
                  </div>
                </td>
                <td class="text-end">
                  <VBtn
                    icon
                    variant="text"
                    size="small"
                    color="primary"
                    title="QR Code"
                    @click="showQR(variant)"
                  >
                    <VIcon icon="bx-qr" size="20" />
                  </VBtn>
                </td>
              </tr>
            </tbody>
          </VTable>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <VDialog
    v-model="qrDialogOpen"
    max-width="440"
  >
    <VCard>
      <VCardTitle class="d-flex align-center gap-3 pa-5">
        <VAvatar
          color="primary"
          variant="tonal"
          size="44"
        >
          <VIcon
            icon="bx-qr"
            size="22"
          />
        </VAvatar>
        <div>
          <div class="text-h6">
            Variant QR Code
          </div>
          <div
            v-if="selectedVariant"
            class="text-caption text-medium-emphasis"
          >
            {{ selectedVariant.product_name }} — {{ selectedVariant.sku }}
          </div>
        </div>
      </VCardTitle>
      <VDivider />
      <VCardText class="d-flex justify-center py-8">
        <div
          ref="qrPrintArea"
          class="qr-print-area"
        >
          <VImg
            v-if="qrImageUrl"
            :src="qrImageUrl"
            width="250"
            height="250"
          />
          <div
            v-if="selectedVariant?.sku"
            class="text-center mt-3 text-body-2"
          >
            {{ selectedVariant.sku }}
          </div>
        </div>
      </VCardText>
      <VDivider />
      <VCardActions class="d-flex justify-space-between pa-5">
        <VBtn
          variant="outlined"
          @click="qrDialogOpen = false"
        >
          Close
        </VBtn>
        <div class="d-flex gap-2">
          <VBtn
            color="secondary"
            variant="tonal"
            prepend-icon="bx-printer"
            @click="printQR"
          >
            Print
          </VBtn>
          <VBtn
            color="primary"
            variant="flat"
            prepend-icon="bx-download"
            @click="downloadQRFile"
          >
            Download
          </VBtn>
        </div>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(var(--v-border-color), 0.2);
  display: inline-block;
  flex-shrink: 0;
}
</style>

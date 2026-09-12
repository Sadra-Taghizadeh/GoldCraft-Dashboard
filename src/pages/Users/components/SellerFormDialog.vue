<script setup>
import { watch } from 'vue'

const props = defineProps({
  seller: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['save'])

const sellerFormModel = defineModel({ type: Boolean, default: false })

const localSeller = ref({
  person_name: '',
  phone_number: '',
  is_active: true,
})

function resetForm() {
  if (props.seller) {
    localSeller.value = {
      person_name: props.seller.person_name || '',
      phone_number: props.seller.phone_number || '',
      is_active: props.seller.is_active ?? true,
    }
  }
  else {
    localSeller.value = {
      person_name: '',
      phone_number: '',
      is_active: true,
    }
  }
}

watch(sellerFormModel, (open) => {
  if (open)
    resetForm()
})

function handleSave() {
  emit('save', { ...localSeller.value })
  sellerFormModel.value = false
}
</script>

<template>
  <VDialog
    v-model="sellerFormModel"
    max-width="560"
  >
    <VCard>
      <VCardTitle class="d-flex align-center gap-3 pa-5">
        <VAvatar
          :color="seller ? 'warning' : 'primary'"
          variant="tonal"
          size="44"
        >
          <VIcon
            :icon="seller ? 'bx-edit' : 'bx-plus'"
            size="22"
          />
        </VAvatar>
        <div class="text-h6">
          {{ seller ? 'Edit Seller' : 'Add New Seller' }}
        </div>
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-5">
        <VRow>
          <VCol cols="12">
            <VTextField
              v-model="localSeller.person_name"
              label="Person Name"
              :rules="[v => !!v || 'Person name is required']"
              density="comfortable"
              variant="outlined"
              prepend-inner-icon="bx-user"
            />
          </VCol>

          <VCol cols="12">
            <VTextField
              v-model="localSeller.phone_number"
              label="Phone Number"
              :rules="[v => !!v || 'Phone number is required']"
              density="comfortable"
              variant="outlined"
              prepend-inner-icon="bx-phone"
              dir="ltr"
            />
          </VCol>

          <VCol cols="12">
            <VSwitch
              v-model="localSeller.is_active"
              label="Active"
              color="success"
              density="comfortable"
              hide-details
            />
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <VCardActions class="d-flex justify-end gap-3 pa-5">
        <VBtn
          variant="outlined"
          size="large"
          @click="sellerFormModel = false"
        >
          Cancel
        </VBtn>
        <VBtn
          color="primary"
          variant="flat"
          size="large"
          :disabled="!localSeller.person_name || !localSeller.phone_number"
          @click="handleSave"
        >
          <VIcon
            start
            :icon="seller ? 'bx-check' : 'bx-plus'"
          />
          {{ seller ? 'Save Changes' : 'Add Seller' }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

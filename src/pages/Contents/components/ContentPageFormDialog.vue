<script setup>
import { watch } from 'vue'

const props = defineProps({
  page: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['save'])

const contentPageModel = defineModel({ type: Boolean, default: false })

const localPage = ref({
  slug: '',
  title: '',
  content: '',
  is_published: true,
})

function resetForm() {
  if (props.page) {
    localPage.value = {
      slug: props.page.slug || '',
      title: props.page.title || '',
      content: props.page.content || '',
      is_published: props.page.is_published ?? true,
    }
  }
  else {
    localPage.value = {
      slug: '',
      title: '',
      content: '',
      is_published: true,
    }
  }
}

watch(contentPageModel, (open) => {
  if (open)
    resetForm()
})

function handleSave() {
  emit('save', { ...localPage.value })
  contentPageModel.value = false
}
</script>

<template>
  <VDialog
    v-model="contentPageModel"
    max-width="700"
  >
    <VCard>
      <VCardTitle class="d-flex align-center gap-3">
        <VIcon
          size="24"
          icon="bx-file"
        />
        <span>{{ page ? 'Edit Page' : 'Add Page' }}</span>
      </VCardTitle>

      <VCardText>
        <VRow>
          <VCol cols="12">
            <VTextField
              v-model="localPage.title"
              label="Title"
              placeholder="Page Title"
            />
          </VCol>

          <VCol cols="12">
            <VTextField
              v-model="localPage.slug"
              label="Slug"
              placeholder="page-slug"
              :disabled="!!page"
            />
          </VCol>

          <VCol cols="12">
            <VTextarea
              v-model="localPage.content"
              label="Content"
              placeholder="Page content"
              auto-grow
              rows="6"
            />
          </VCol>

          <VCol cols="12">
            <VSwitch
              v-model="localPage.is_published"
              label="Published"
              color="primary"
              true-value
              false-value
            />
          </VCol>
        </VRow>
      </VCardText>

      <VCardActions class="d-flex justify-end gap-2 pa-4">
        <VBtn
          variant="outlined"
          @click="contentPageModel = false"
        >
          Cancel
        </VBtn>
        <VBtn
          color="primary"
          @click="handleSave"
        >
          {{ page ? 'Edit Page' : 'Add Page' }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

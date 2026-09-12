<script setup>
const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  search: {
    type: String,
    default: '',
  },
  searchLabel: {
    type: String,
    default: 'Search',
  },
  searchPlaceholder: {
    type: String,
    default: '',
  },
  showSearch: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:search'])

function updateSearch(value) {
  emit('update:search', value)
}
</script>

<template>
  <VCardTitle class="d-flex align-center justify-space-between flex-wrap gap-4">
    <div class="d-flex align-center gap-3 flex-wrap">
      <slot name="title">
        <div class="text-h6">
          {{ props.title }}
        </div>
      </slot>
    </div>

    <div class="d-flex align-center gap-3 flex-wrap">
      <VTextField
        v-if="props.showSearch"
        v-persian-convert
        :model-value="props.search"
        :label="props.searchLabel"
        density="compact"
        hide-details
        clearable
        style="min-width: 220px"
        @update:model-value="updateSearch"
      />
      <slot name="filters" />
      <slot name="actions" />
    </div>
  </VCardTitle>
</template>

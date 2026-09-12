<script setup>
const props = defineProps({
  actions: {
    type: Array,
    default: () => [],
  },
  iconSize: {
    type: [String, Number],
    default: 20,
  },
})

const emit = defineEmits(['select'])

function handleSelect(action) {
  emit('select', action)
}
</script>

<template>
  <IconBtn>
    <VIcon
      :size="props.iconSize"
      icon="bx-dots-vertical-rounded"
    />

    <VMenu activator="parent">
      <VList density="compact">
        <VListItem
          v-for="action in props.actions"
          :key="action.value"
          :disabled="action.disabled"
          @click="handleSelect(action)"
        >
          <template #prepend>
            <VIcon
              class="me-2"
              :icon="action.icon"
              size="20"
            />
          </template>

          <VListItemTitle>
            {{ action.title }}
          </VListItemTitle>
        </VListItem>
      </VList>
    </VMenu>
  </IconBtn>
</template>

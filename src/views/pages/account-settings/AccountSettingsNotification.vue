<script setup>
const recentDevices = ref([
  {
    type: 'New for You',
    email: true,
    browser: true,
    app: true,
  },
  {
    type: 'Account Activity',
    email: true,
    browser: true,
    app: true,
  },
  {
    type: 'Login from New Browser',
    email: true,
    browser: true,
    app: false,
  },
  {
    type: 'A New Device Has Connected',
    email: true,
    browser: false,
    app: false,
  },
])

const selectedNotification = ref('Only When I\'m Online')
</script>

<template>
  <VCard title="Recent Devices">
    <VCardText>
      We need your browser's permission to show you notifications.
      <a href="javascript:void(0)">Request Permission</a>
    </VCardText>

    <VTable class="text-no-wrap">
      <thead>
        <tr>
          <th scope="col">
            Type
          </th>
          <th scope="col">
            Email
          </th>
          <th scope="col">
            Browser
          </th>
          <th scope="col">
            App
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="device in recentDevices"
          :key="device.type"
        >
          <td>
            {{ device.type }}
          </td>
          <td>
            <VCheckbox v-model="device.email" />
          </td>
          <td>
            <VCheckbox v-model="device.browser" />
          </td>
          <td>
            <VCheckbox v-model="device.app" />
          </td>
        </tr>
      </tbody>
    </VTable>
    <VDivider />

    <VCardText>
      <VForm @submit.prevent="() => {}">
        <p class="text-base font-weight-medium">
          When should we send you notifications?
        </p>

        <VRow>
          <VCol
            cols="12"
            sm="6"
          >
            <VSelect
              v-model="selectedNotification"
              mandatory
              :items="['Only When I\'m Online', 'Anytime']"
            />
          </VCol>
        </VRow>

        <div class="d-flex flex-wrap gap-4 mt-4">
          <VBtn type="submit">
            Save Changes
          </VBtn>
          <VBtn
            color="secondary"
            variant="tonal"
            type="reset"
          >
            Reset
          </VBtn>
        </div>
      </VForm>
    </VCardText>
  </VCard>
</template>

<style lang="scss" scoped>
.v-table {
  th {
    text-align: start !important;
  }
}
</style>

<script setup>
const customers = ref([
  { id: 1, name: 'Ali Mohammadi', phone: '09121234567', email: 'ali@example.com', orders_count: 12, total_spent: '52,340,000', registered_at: '2023/09/06' },
  { id: 2, name: 'Maryam Ahmadi', phone: '09131234567', email: 'maryam@example.com', orders_count: 8, total_spent: '31,200,000', registered_at: '2023/11/13' },
  { id: 3, name: 'Reza Karimi', phone: '09141234567', email: 'reza@example.com', orders_count: 5, total_spent: '18,950,000', registered_at: '2024/04/01' },
  { id: 4, name: 'Sara Hosseini', phone: '09151234567', email: 'sara@example.com', orders_count: 20, total_spent: '89,750,000', registered_at: '2023/05/26' },
  { id: 5, name: 'Amir Rezaei', phone: '09161234567', email: 'amir@example.com', orders_count: 3, total_spent: '9,800,000', registered_at: '2024/07/09' },
])

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Name', key: 'name' },
  { title: 'Phone', key: 'phone' },
  { title: 'Email', key: 'email' },
  { title: 'Orders Count', key: 'orders_count' },
  { title: 'Total Spent', key: 'total_spent' },
  { title: 'Registration Date', key: 'registered_at' },
]
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <VCardItem>
          <VCardTitle>Customer Management</VCardTitle>
        </VCardItem>

        <VDivider />

        <VCardText>
          <VTable class="text-no-wrap">
            <thead>
              <tr>
                <th
                  v-for="header in headers"
                  :key="header.key"
                  class="text-uppercase"
                >
                  {{ header.title }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="customers.length === 0">
                <td
                  colspan="7"
                  class="text-center text-medium-emphasis py-6"
                >
                  No customers to display.
                </td>
              </tr>
              <tr
                v-for="customer in customers"
                :key="customer.id"
              >
                <td>{{ customer.id }}</td>
                <td>{{ customer.name }}</td>
                <td>{{ customer.phone }}</td>
                <td>{{ customer.email }}</td>
                <td>{{ customer.orders_count }}</td>
                <td>{{ customer.total_spent }} Toman</td>
                <td>{{ customer.registered_at }}</td>
              </tr>
            </tbody>
          </VTable>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

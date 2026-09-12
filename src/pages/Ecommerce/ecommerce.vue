<script setup>
const stats = [
  { title: 'Today\'s Sales', value: '12,840,000', icon: 'bx-dollar', color: 'success' },
  { title: 'Today\'s Orders', value: '24', icon: 'bx-cart', color: 'info' },
  { title: 'Today\'s Visitors', value: '1,256', icon: 'bx-group', color: 'warning' },
  { title: 'Conversion Rate', value: '3.2%', icon: 'bx-trending-up', color: 'primary' },
]

const recentOrders = [
  { id: 1, customer: 'Ali Mohammadi', product: 'Gold Bracelet', amount: '8,400,000', status: 'completed' },
  { id: 2, customer: 'Maryam Ahmadi', product: 'Silver Necklace', amount: '3,200,000', status: 'in_progress' },
  { id: 3, customer: 'Reza Karimi', product: 'Wedding Ring', amount: '12,000,000', status: 'submitted' },
  { id: 4, customer: 'Sara Hosseini', product: 'Gold Earrings', amount: '5,600,000', status: 'completed' },
  { id: 5, customer: 'Amir Rezaei', product: 'Wristwatch', amount: '2,400,000', status: 'cancelled' },
]

const statusLabels = {
  completed: 'Completed',
  in_progress: 'In Progress',
  submitted: 'Submitted',
  cancelled: 'Cancelled',
}

const statusColors = {
  completed: 'success',
  in_progress: 'warning',
  submitted: 'info',
  cancelled: 'error',
}
</script>

<template>
  <div>
    <h4 class="text-h4 mb-6">
      E-Commerce Dashboard
    </h4>

    <VRow>
      <VCol
        v-for="stat in stats"
        :key="stat.title"
        cols="12"
        sm="6"
        md="3"
      >
        <VCard>
          <VCardText class="d-flex align-center gap-3">
            <VAvatar
              :color="stat.color"
              variant="tonal"
              rounded
            >
              <VIcon :icon="stat.icon" />
            </VAvatar>
            <div>
              <p class="text-caption mb-0">
                {{ stat.title }}
              </p>
              <h5 class="text-h5 mb-0">
                {{ stat.value }}
              </h5>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VRow class="mt-2">
      <VCol cols="12">
        <VCard>
          <VCardItem>
            <VCardTitle>Recent Orders</VCardTitle>
          </VCardItem>

          <VDivider />

          <VCardText>
            <VTable class="text-no-wrap">
              <thead>
                <tr>
                  <th class="text-uppercase">
                    ID
                  </th>
                  <th class="text-uppercase">
                    Customer
                  </th>
                  <th class="text-uppercase">
                    Product
                  </th>
                  <th class="text-uppercase">
                    Amount
                  </th>
                  <th class="text-uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="order in recentOrders"
                  :key="order.id"
                >
                  <td>{{ order.id }}</td>
                  <td>{{ order.customer }}</td>
                  <td>{{ order.product }}</td>
                  <td>{{ order.amount }} Toman</td>
                  <td>
                    <VChip
                      size="small"
                      label
                      :color="statusColors[order.status]"
                    >
                      {{ statusLabels[order.status] }}
                    </VChip>
                  </td>
                </tr>
              </tbody>
            </VTable>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>

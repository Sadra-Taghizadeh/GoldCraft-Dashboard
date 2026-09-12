<script setup>
import VerticalNavGroup from '@layouts/components/VerticalNavGroup.vue'
import VerticalNavLink from '@layouts/components/VerticalNavLink.vue'
import VerticalNavSectionTitle from '@/@layouts/components/VerticalNavSectionTitle.vue'
import { useAuth } from '@/composables/useAuth'

const { role } = useAuth()
</script>

<template>
  <!-- Seller: QR code page only + account settings -->
  <template v-if="role === 'seller'">
    <VerticalNavLink
      :item="{
        title: 'QR Codes',
        icon: 'bx-qr',
        to: '/qr-codes',
      }"
    />
    <VerticalNavSectionTitle
      :item="{
        heading: 'Settings',
      }"
    />
    <VerticalNavLink
      :item="{
        title: 'Account Settings',
        icon: 'bx-user',
        to: '/account-settings',
      }"
    />
  </template>

  <!-- Admin & Support: full navigation -->
  <template v-else>
    <VerticalNavLink
      :item="{
        title: 'Dashboard',
        icon: 'bx-home-smile',
        to: '/dashboard',
      }"
    />
    <VerticalNavLink
      :item="{
        title: 'Warehouse',
        icon: 'bx-building-house',
        to: '/warehouse',
      }"
    />

    <!-- 👉 Product -->
    <VerticalNavGroup
      :item="{
        title: 'Products',
        icon: 'bx-package',
      }"
    >
      <VerticalNavLink
        :item="{
          title: 'Product List',
          to: '/products',
        }"
      />

      <VerticalNavLink
        :item="{
          title: 'Product Categories',
          to: '/product-categories',
        }"
      />
      <VerticalNavLink
        :item="{
          title: 'Colors',
          to: '/product-colors',
        }"
      />
      <VerticalNavLink
        :item="{
          title: 'Favorite Products',
          to: '/product-favorites',
        }"
      />
    </VerticalNavGroup>
    <VerticalNavGroup
      :item="{
        title: 'Content',
        icon: 'bx-file',
      }"
    >
      <VerticalNavLink
        :item="{
          title: 'Pages',
          to: '/content-pages',
        }"
      />
      <VerticalNavLink
        :item="{
          title: 'FAQ',
          to: '/content-faqs',
        }"
      />
    </VerticalNavGroup>

    <VerticalNavGroup
      :item="{
        title: 'Orders and Transactions',
        icon: 'bx-shopping-bag',
      }"
    >
      <VerticalNavLink
        :item="{
          title: 'Order List',
          to: '/orders',
        }"
      />
      <VerticalNavLink
        :item="{
          title: 'Transactions',
          to: '/transactions',
        }"
      />
    </VerticalNavGroup>

    <VerticalNavLink
      :item="{
        title: 'Rate List',
        icon: 'bx-coin',
        to: '/price-list',
      }"
    />

    <VerticalNavGroup
      :item="{
        title: 'Users',
        icon: 'bx-group',
      }"
    >
      <VerticalNavLink
        :item="{
          title: 'User List',
          to: '/users',
        }"
      />
      <VerticalNavLink
        :item="{
          title: 'Sellers',
          to: '/sellers',
        }"
      />
    </VerticalNavGroup>

    <VerticalNavSectionTitle
      :item="{
        heading: 'Settings',
      }"
    />
    <VerticalNavLink
      :item="{
        title: 'Account Settings',
        icon: 'bx-user',
        to: '/account-settings',
      }"
    />
  </template>
</template>

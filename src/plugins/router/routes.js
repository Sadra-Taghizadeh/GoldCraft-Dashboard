export const routes = [
  { path: '/', redirect: '/dashboard' },
  {
    path: '/',
    component: () => import('@/layouts/default.vue'),
    children: [
      {
        path: 'dashboard',
        component: () => import('@/pages/dashboard.vue'),
        meta: { roles: ['admin', 'support'] },
      },
      {
        path: 'warehouse',
        component: () => import('@/pages/Warehouse/warehouse.vue'),
        meta: { roles: ['admin', 'support'] },
      },
      {
        path: 'customers',
        component: () => import('@/pages/Customers/customers.vue'),
        meta: { roles: ['admin', 'support'] },
      },
      {
        path: 'ecommerce',
        component: () => import('@/pages/Ecommerce/ecommerce.vue'),
        meta: { roles: ['admin', 'support'] },
      },
      {
        path: 'orders',
        component: () => import('@/pages/Orders/orders.vue'),
        meta: { roles: ['admin', 'support'] },
      },
      {
        path: 'transactions',
        component: () => import('@/pages/Transactions/transactions.vue'),
        meta: { roles: ['admin', 'support'] },
      },
      {
        path: 'product-categories',
        component: () => import('@/pages/Products/categories.vue'),
        meta: { roles: ['admin', 'support'] },
      },
      {
        path: 'product-colors',
        component: () => import('@/pages/Products/colors.vue'),
        meta: { roles: ['admin', 'support'] },
      },
      {
        path: 'products',
        component: () => import('@/pages/Products/products.vue'),
        meta: { roles: ['admin', 'support'] },
      },
      {
        path: 'product-favorites',
        component: () => import('@/pages/Products/favorites.vue'),
        meta: { roles: ['admin', 'support'] },
      },
      {
        path: 'content-pages',
        component: () => import('@/pages/Contents/pages.vue'),
        meta: { roles: ['admin', 'support'] },
      },
      {
        path: 'content-faqs',
        component: () => import('@/pages/Contents/faqs.vue'),
        meta: { roles: ['admin', 'support'] },
      },
      {
        path: 'price-list',
        component: () => import('@/pages/Gold/price-list.vue'),
        meta: { roles: ['admin', 'support'] },
      },
      {
        path: 'users',
        component: () => import('@/pages/Users/users.vue'),
        meta: { roles: ['admin', 'support'] },
      },
      {
        path: 'sellers',
        component: () => import('@/pages/Users/sellers.vue'),
        meta: { roles: ['admin', 'support'] },
      },
      {
        path: 'qr-codes',
        component: () => import('@/pages/QRCode/qrcode.vue'),
      },
      {
        path: 'account-settings',
        component: () => import('@/pages/account-settings.vue'),
      },
    ],
  },
  {
    path: '/',
    component: () => import('@/layouts/blank.vue'),
    children: [
      {
        path: 'login',
        meta: { public: true },
        component: () => import('@/views/pages/authentication/login.vue'),
      },
      {
        path: 'products/variants/:sku',
        meta: { public: true },
        component: () => import('@/pages/Products/VariantPublic.vue'),
      },
      {
        path: '/:pathMatch(.*)*',
        meta: { public: true },
        component: () => import('@/pages/[...error].vue'),
      },
    ],
  },
]

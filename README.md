# Bellucci Gold Dashboard

A modern admin dashboard for managing gold & jewelry e-commerce operations, built with Vue 3, Vuetify 3, and Vite.

## Tech Stack

- **Framework:** Vue 3 (Composition API)
- **UI Library:** Vuetify 3
- **Build Tool:** Vite 7
- **CSS:** TailwindCSS 4 + SCSS
- **State Management:** Pinia
- **Routing:** Vue Router 5
- **Charts:** ApexCharts (vue3-apexcharts)
- **HTTP Client:** Axios
- **Icons:** Boxicons + Iconify

## Features

- **Dashboard** -- Sales, revenue, profit, and transaction analytics with charts
- **Products** -- Product management with categories, colors, variants, and images
- **Warehouse** -- Inventory/variant tracking with stock levels and weight management
- **Orders** -- Order listing, status management, and detail views
- **Transactions** -- Payment transaction tracking with return/refund support
- **Gold & Currency** -- Live price list for gold, coins, and foreign currencies
- **Users** -- User and seller management with role-based access
- **Contents** -- CMS for static pages and FAQ management
- **QR Codes** -- QR code generation for product variants
- **E-Commerce** -- Sales overview and recent orders
- **Account Settings** -- Profile, security, and notification preferences
- **Global Search** -- Search across orders, products, and categories

## Project Structure

```
src/
├── @core/              # Core reusable components
├── @layouts/           # Layout system
├── assets/             # Styles and static assets
├── components/         # Shared components (TableCardToolbar, DeleteConfirmDialog, etc.)
├── composables/        # Vue composables
├── directives/         # Custom Vue directives (e.g. v-persian-convert)
├── layouts/            # Layout components (sidebar, navbar, user profile)
├── pages/              # Route-level page components
│   ├── Contents/       # Pages & FAQ management
│   ├── Customers/      # Customer list
│   ├── Ecommerce/      # E-commerce dashboard
│   ├── Gold/           # Gold & currency price list
│   ├── Orders/         # Orders & transactions
│   ├── Products/       # Products, categories, colors, favorites
│   ├── QRCode/         # QR code generation
│   ├── Transactions/   # Transaction management
│   ├── Users/          # Users & sellers
│   └── Warehouse/      # Inventory management
├── plugins/            # Vuetify, Iconify plugins
├── services/           # API service layer (auth, products, orders, etc.)
├── utils/              # Utilities (currency formatting, digit conversion)
└── views/              # Dashboard views & account settings
```

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd goldcraft-portfolio

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API base URL | `/api` |
| `VITE_BRSAPI_KEY` | BRS API key for gold/currency rates | -- |

### Development

```bash
npm run dev
```

The dev server runs at `http://127.0.0.1:5173` with API proxy to `https://belluccidesign.gold`.

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## Docker

```bash
# Build with API URL argument
docker build --build-arg VITE_API_BASE_URL=/api -t bellucci-dashboard .

# The built static files are available in /dist inside the container
```

The production image uses a multi-stage build (Node for building, Alpine for serving). Static files in `/dist` are intended to be served by an external Nginx reverse proxy.

## License

Private -- All rights reserved.

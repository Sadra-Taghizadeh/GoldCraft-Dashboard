import { delay } from './mock/delay'
import {
  mockCategories,
  mockColors,
  mockFavorites,
  mockProducts,
  mockVariants,
} from './mock/data'

let _categories = [...mockCategories]
let _products = [...mockProducts]
let _colors = [...mockColors]
let _variants = [...mockVariants]
let _favorites = [...mockFavorites]

export async function fetchProductCategories() {
  await delay()
  return [..._categories]
}

export async function fetchProductCategoryDetail(slug) {
  if (!slug) throw new Error('slug is required')
  await delay()
  const cat = _categories.find(c => c.slug === slug)
  if (!cat) throw new Error('Category not found')
  return { ...cat }
}

export async function createProductCategory(payload) {
  await delay()
  const newCat = { id: _categories.length + 1, ...payload, slug: payload.name?.toLowerCase().replace(/\s+/g, '-') || 'new-category' }
  _categories.push(newCat)
  return { ...newCat }
}

export async function updateProductCategory(slug, payload) {
  if (!slug) throw new Error('slug is required')
  await delay()
  const idx = _categories.findIndex(c => c.slug === slug)
  if (idx === -1) throw new Error('Category not found')
  _categories[idx] = { ..._categories[idx], ...payload }
  return { ..._categories[idx] }
}

export async function deleteProductCategory(slug) {
  if (!slug) throw new Error('slug is required')
  await delay()
  _categories = _categories.filter(c => c.slug !== slug)
  return { detail: 'Deleted.' }
}

export async function fetchProducts() {
  await delay()
  return [..._products]
}

export async function fetchProductVariants() {
  await delay()
  return [..._variants]
}

export async function fetchFavoriteProducts() {
  await delay()
  return [..._favorites]
}

export async function fetchProductDetail(slug) {
  if (!slug) throw new Error('slug is required')
  await delay()
  const product = _products.find(p => p.slug === slug)
  if (!product) throw new Error('Product not found')
  return { ...product, variants: _variants.filter(v => v.product === product.id) }
}

export async function createProduct(payload) {
  await delay()
  const newProduct = {
    id: _products.length + 1,
    ...payload,
    slug: payload.name?.toLowerCase().replace(/\s+/g, '-') || 'new-product',
    total_quantity: 0,
    variants_count: 0,
    primary_image: 'https://placehold.co/600x600/FFD700/333?text=New+Product',
  }
  _products.push(newProduct)
  return { ...newProduct }
}

export async function updateProduct(slug, payload) {
  if (!slug) throw new Error('slug is required')
  await delay()
  const idx = _products.findIndex(p => p.slug === slug)
  if (idx === -1) throw new Error('Product not found')
  _products[idx] = { ..._products[idx], ...payload }
  return { ..._products[idx] }
}

export async function deleteProduct(slug) {
  if (!slug) throw new Error('slug is required')
  await delay()
  _products = _products.filter(p => p.slug !== slug)
  return { detail: 'Deleted.' }
}

export async function fetchProductVariantDetail(id) {
  if (!id) throw new Error('id is required')
  await delay()
  const variant = _variants.find(v => v.id === id)
  if (!variant) throw new Error('Variant not found')
  return { ...variant }
}

export async function fetchProductVariantBySku(sku) {
  if (!sku) throw new Error('sku is required')
  await delay()
  const variant = _variants.find(v => v.sku === sku)
  if (!variant) throw new Error('Variant not found')
  return { ...variant }
}

export async function sellProduct(payload) {
  await delay()
  return { detail: 'Product sold successfully.', order_id: 100 }
}

export async function createProductVariant(payload) {
  await delay()
  const newVariant = { id: _variants.length + 1, ...payload, quantity: payload.quantity || 0 }
  _variants.push(newVariant)
  return { ...newVariant }
}

export async function updateProductVariant(id, payload) {
  if (!id) throw new Error('id is required')
  await delay()
  const idx = _variants.findIndex(v => v.id === id)
  if (idx === -1) throw new Error('Variant not found')
  _variants[idx] = { ..._variants[idx], ...payload }
  return { ..._variants[idx] }
}

export async function deleteProductVariant(id) {
  if (!id) throw new Error('id is required')
  await delay()
  _variants = _variants.filter(v => v.id !== id)
  return { detail: 'Deleted.' }
}

export async function fetchProductVariantQR(id) {
  if (!id) throw new Error('id is required')
  await delay()
  return new Blob(['QR placeholder'], { type: 'image/png' })
}

export async function fetchProductFeeDetail(id) {
  if (!id) throw new Error('id is required')
  await delay()
  return { id, fee: 500000, fee_type: 'fixed' }
}

export async function createProductFee(payload) {
  await delay()
  return { id: Date.now(), ...payload }
}

export async function updateProductFee(id, payload) {
  if (!id) throw new Error('id is required')
  await delay()
  return { id, ...payload }
}

export async function deleteProductFee(id) {
  if (!id) throw new Error('id is required')
  await delay()
  return { detail: 'Deleted.' }
}

export async function fetchProductColors() {
  await delay()
  return [..._colors]
}

export async function fetchProductColorDetail(id) {
  if (!id) throw new Error('id is required')
  await delay()
  const color = _colors.find(c => c.id === id)
  if (!color) throw new Error('Color not found')
  return { ...color }
}

export async function createProductColor(payload) {
  await delay()
  const newColor = { id: _colors.length + 1, ...payload }
  _colors.push(newColor)
  return { ...newColor }
}

export async function updateProductColor(id, payload) {
  if (!id) throw new Error('id is required')
  await delay()
  const idx = _colors.findIndex(c => c.id === id)
  if (idx === -1) throw new Error('Color not found')
  _colors[idx] = { ..._colors[idx], ...payload }
  return { ..._colors[idx] }
}

export async function deleteProductColor(id) {
  if (!id) throw new Error('id is required')
  await delay()
  _colors = _colors.filter(c => c.id !== id)
  return { detail: 'Deleted.' }
}

export async function createFeeProfile(payload) {
  await delay()
  return { id: Date.now(), ...payload }
}

export async function updateFeeProfile(id, payload) {
  if (!id) throw new Error('id is required')
  await delay()
  return { id, ...payload }
}

export async function fetchFeeProfileDetail(id) {
  if (!id) throw new Error('id is required')
  await delay()
  return { id, name: 'Standard Profile', tiers: [] }
}

export async function deleteFeeProfile(id) {
  if (!id) throw new Error('id is required')
  await delay()
  return { detail: 'Deleted.' }
}

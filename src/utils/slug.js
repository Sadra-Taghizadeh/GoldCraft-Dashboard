export function generateSlug(text) {
  if (!text)
    return ''

  return text
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

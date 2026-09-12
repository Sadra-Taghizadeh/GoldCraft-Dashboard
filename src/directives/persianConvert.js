import { convertDigits } from '@/utils/currency'

const PERSIAN_ARABIC_RE = /[۰-۹٠-٩]/

export const vPersianConvert = {
  mounted(el) {
    el.addEventListener('paste', (e) => {
      const text = e.clipboardData?.getData('text')
      if (text && PERSIAN_ARABIC_RE.test(text)) {
        e.preventDefault()

        const converted = convertDigits(text, 'en')
        const start = el.selectionStart
        const end = el.selectionEnd
        const current = el.value

        el.value = current.slice(0, start) + converted + current.slice(end)
        el.selectionStart = el.selectionEnd = start + converted.length
        el.dispatchEvent(new Event('input', { bubbles: true }))
      }
    })

    el.addEventListener('input', () => {
      if (PERSIAN_ARABIC_RE.test(el.value)) {
        const start = el.selectionStart
        const converted = convertDigits(el.value, 'en')

        el.value = converted
        el.selectionStart = el.selectionEnd = start
        el.dispatchEvent(new Event('input', { bubbles: true }))
      }
    })
  },
}

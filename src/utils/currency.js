export function convertDigits(str, toType) {
  if (!str)
    return str

  const faDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  const arDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
  const enDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

  let result = String(str)

  for (let i = 0; i < 10; i++) {
    const faRegex = new RegExp(faDigits[i], 'g')
    const arRegex = new RegExp(arDigits[i], 'g')

    result = result.replace(faRegex, enDigits[i])
    result = result.replace(arRegex, enDigits[i])
  }

  if (toType === 'fa') {
    for (let i = 0; i < 10; i++) {
      const enRegex = new RegExp(enDigits[i], 'g')

      result = result.replace(enRegex, faDigits[i])
    }
  }
  else if (toType === 'ar') {
    for (let i = 0; i < 10; i++) {
      const enRegex = new RegExp(enDigits[i], 'g')

      result = result.replace(enRegex, arDigits[i])
    }
  }

  return result
}

export function formatPersianNumber(number, decimals = 0) {
  if (number === null || number === undefined || isNaN(number)) {
    return '۰'
  }

  const num = Number.parseFloat(number)
  const fixed = num.toFixed(decimals)
  const parts = fixed.split('.')

  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  const formatted = parts.join('.')

  return convertDigits(formatted, 'fa')
}

export function parsePersianNumber(str) {
  if (!str)
    return 0

  const normalized = convertDigits(str, 'en').replace(/,/g, '')
  const parsed = Number.parseFloat(normalized)

  return isNaN(parsed) ? 0 : parsed
}

export function formatChangePercent(value) {
  if (value === null || value === undefined || isNaN(value))
    return null

  const num = Number.parseFloat(value)
  const sign = num >= 0 ? '+' : ''

  return `${sign}${num.toFixed(2)}%`
}

export function formatChangeValue(value) {
  if (value === null || value === undefined || isNaN(value))
    return null

  const num = Number.parseFloat(value)
  const sign = num >= 0 ? '+' : ''

  return `${sign}${formatPersianNumber(Math.abs(num))}`
}

export async function fetchCurrencyRates() {
  await new Promise(resolve => setTimeout(resolve, 300))

  return {
    usd: { value: 580000, name: 'US Dollar', changeValue: -1700, changePercent: -0.3, type: 'currency', unit: 'Toman' },
    eur: { value: 635000, name: 'Euro', changeValue: 1270, changePercent: 0.2, type: 'currency', unit: 'Toman' },
    gbp: { value: 740000, name: 'British Pound', changeValue: 2220, changePercent: 0.3, type: 'currency', unit: 'Toman' },
    try: { value: 17500, name: 'Turkish Lira', changeValue: -88, changePercent: -0.5, type: 'currency', unit: 'Toman' },
    aed: { value: 158000, name: 'UAE Dirham', changeValue: -158, changePercent: -0.1, type: 'currency', unit: 'Toman' },
    gold_18k: { value: 3200000, name: 'Gold 18K', changeValue: 38400, changePercent: 1.2, type: 'gold', unit: 'Toman' },
    gold_24k: { value: 4200000, name: 'Gold 24K', changeValue: 33600, changePercent: 0.8, type: 'gold', unit: 'Toman' },
    gold_melted: { value: 4150000, name: 'Melted Gold', changeValue: 33200, changePercent: 0.8, type: 'gold', unit: 'Toman' },
    gold_ounce: { value: 250000000, name: 'Gold Ounce', changeValue: 2500000, changePercent: 1.0, type: 'gold', unit: 'Toman' },
    coin_1g: { value: 4800000, name: '1g Coin', changeValue: 48000, changePercent: 1.0, type: 'gold', unit: 'Toman' },
    coin_quarter: { value: 12000000, name: 'Quarter Coin', changeValue: 120000, changePercent: 1.0, type: 'gold', unit: 'Toman' },
    coin_half: { value: 24000000, name: 'Half Coin', changeValue: 240000, changePercent: 1.0, type: 'gold', unit: 'Toman' },
    coin_emami: { value: 48000000, name: 'Emami Coin', changeValue: 480000, changePercent: 1.0, type: 'gold', unit: 'Toman' },
    coin_bahar: { value: 47000000, name: 'Bahar Coin', changeValue: 470000, changePercent: 1.0, type: 'gold', unit: 'Toman' },
  }
}

export function getCurrencySymbol(currencyCode) {
  const symbols = {
    usd: '$',
    eur: '€',
    gbp: '£',
    try: '₺',
    aed: 'د.إ',
    omr: 'ر.ع.',
    afn: '؋',
    jpy: '¥',
    aud: 'A$',
    cad: 'C$',
    chf: 'Fr',
    pkr: '₨',
    azn: '₼',
    sek: 'kr',
    kwd: 'د.ك',
    rub: '₽',
    thb: '฿',
    inr: '₹',
    cny: '¥',
    myr: 'RM',
    gel: '₾',
    sar: 'ر.س',
    qar: 'ر.ق',
    bhd: 'د.ب',
    iqd: 'د.ع',
    syp: 'ل.س',
    amd: '֏',
  }

  return symbols[currencyCode] || currencyCode.toUpperCase()
}

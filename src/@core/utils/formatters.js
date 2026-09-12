// TODO: Try to implement this: https://twitter.com/fireship_dev/status/1565424801216311297
export function kFormatter(num) {
  const regex = /\B(?=(\d{3})+(?!\d))/g

  return Math.abs(num) > 9999 ? `${Math.sign(num) * +((Math.abs(num) / 1000).toFixed(1))}k` : Math.abs(num).toFixed(0).replace(regex, ',')
}

export function formatPhoneNumber(phone) {
  if (!phone)
    return phone

  return phone.replace(/^\+98/, '0')
}

const MOCK_DELAY = 300

export function delay(ms = MOCK_DELAY) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

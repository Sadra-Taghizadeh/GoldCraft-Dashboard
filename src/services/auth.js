import { delay } from './mock/delay'
import { mockProfile } from './mock/data'

let _profile = { ...mockProfile }

export function clearTokenTimers() {}

export function notifyTokenObtained() {}

export async function checkAuthStatus() {
  await delay(50)
  return { isAuthenticated: true, role: 'admin', tokenExpiresIn: 86400 }
}

export async function getUserProfile() {
  await delay()
  return { ..._profile }
}

export async function putUserProfile(payload) {
  await delay()
  _profile = { ..._profile, ...payload }
  return { ..._profile }
}

export async function authenticateAdmin() {
  await delay()
  return { detail: 'OTP sent successfully.' }
}

export async function verifyAdminCode() {
  await delay()
  return { detail: 'Verified successfully.' }
}

export async function refreshAccessToken() {
  return { token_expires_in: 86400 }
}

export async function logout() {
  await delay()
  return { detail: 'Logged out.' }
}

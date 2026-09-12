import { delay } from './mock/delay'
import { mockUsers } from './mock/data'

let _users = [...mockUsers]

export async function fetchUsers(params = {}) {
  await delay()
  let result = [..._users]

  if (params.search) {
    const s = params.search.toLowerCase()
    result = result.filter(u =>
      u.name?.toLowerCase().includes(s)
      || u.email?.toLowerCase().includes(s)
      || u.phone_number?.includes(s),
    )
  }

  return result
}

export async function fetchUserProfile(userId) {
  await delay()
  const user = _users.find(u => u.id === userId)
  if (!user) throw new Error('User not found')
  return { ...user }
}

export async function updateUserProfile(userId, data) {
  await delay()
  const idx = _users.findIndex(u => u.id === userId)
  if (idx === -1) throw new Error('User not found')
  _users[idx] = { ..._users[idx], ...data }
  return { ..._users[idx] }
}

export async function verifyUser(userId, isVerified) {
  await delay()
  const idx = _users.findIndex(u => u.id === userId)
  if (idx === -1) throw new Error('User not found')
  _users[idx] = { ..._users[idx], is_verified: isVerified }
  return { ..._users[idx] }
}

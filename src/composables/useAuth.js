import { readonly, ref } from 'vue'

const role = ref(null)

export function setRole(newRole) {
  role.value = newRole
}

export function useAuth() {
  return {
    role: readonly(role),
  }
}

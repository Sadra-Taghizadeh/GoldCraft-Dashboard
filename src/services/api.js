import { delay } from './mock/delay'

export default {
  interceptors: {
    response: { use() {} },
  },
  get: async () => ({ data: {} }),
  post: async () => ({ data: {} }),
  put: async () => ({ data: {} }),
  patch: async () => ({ data: {} }),
  delete: async () => ({ data: {} }),
}

export const refreshClient = {
  post: async () => ({ data: { token_expires_in: 86400 } }),
}

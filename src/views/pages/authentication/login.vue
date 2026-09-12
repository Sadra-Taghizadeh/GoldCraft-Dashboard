<script setup>
import logo from '@images/logo/1.svg?raw'
import { computed, nextTick, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authenticateAdmin, checkAuthStatus, verifyAdminCode } from '@/services/auth'

const router = useRouter()

const phoneNumber = ref('')
const otpDigits = ref(['', '', '', '', '', ''])
const otpRefs = ref([])
const step = ref('request')
const isSubmitting = ref(false)
const errorMessage = ref('')
const infoMessage = ref('')
let webOtpAbort = null

const isRequestStep = computed(() => step.value === 'request')
const isVerifyStep = computed(() => step.value === 'verify')

const verificationCode = computed(() => otpDigits.value.join(''))

const nextEmptyIndex = computed(() => otpDigits.value.findIndex(d => d === ''))

const canSubmit = computed(() => {
  if (isRequestStep.value)
    return phoneNumber.value.trim().length > 0

  return (
    phoneNumber.value.trim().length > 0 && verificationCode.value.length === 6
  )
})

const isWebOtpSupported = typeof navigator !== 'undefined'
  && navigator.credentials
  && 'OTPCredential' in window

async function requestWebOtp() {
  if (!isWebOtpSupported)
    return

  try {
    webOtpAbort?.abort()
    webOtpAbort = new AbortController()

    const credential = await navigator.credentials.get({
      signal: webOtpAbort.signal,
      otp: { transport: ['sms'] },
    })

    if (credential?.code) {
      const code = credential.code.replace(/\D/g, '').slice(0, 6)

      code.split('').forEach((char, i) => {
        otpDigits.value[i] = char
      })
      focusOtpInput(Math.min(code.length, 5))
      if (code.length === 6)
        handleSubmit()
    }
  }
  catch {
    // Web OTP not available or user cancelled — silent fallback
  }
}

function handleOtpInput(index, event) {
  const value = event.target.value.replace(/\D/g, '')

  if (value.length > 1) {
    const chars = value.slice(0, 6 - index).split('')

    chars.forEach((char, i) => {
      if (index + i < 6)
        otpDigits.value[index + i] = char
    })

    const nextIndex = Math.min(index + chars.length, 5)

    focusOtpInput(nextIndex)
  }
  else {
    otpDigits.value[index] = value
    if (value && index < 5)
      focusOtpInput(index + 1)
  }

  if (otpDigits.value.every(d => d !== ''))
    handleSubmit()
}

function handleOtpKeydown(index, event) {
  if (event.key === 'Backspace') {
    if (!otpDigits.value[index] && index > 0) {
      otpDigits.value[index - 1] = ''
      focusOtpInput(index - 1)
    }
    else {
      otpDigits.value[index] = ''
    }
    event.preventDefault()
  }
  else if (event.key === 'ArrowLeft' && index < 5) {
    focusOtpInput(index + 1)
  }
  else if (event.key === 'ArrowRight' && index > 0) {
    focusOtpInput(index - 1)
  }
}

function handleOtpPaste(event) {
  event.preventDefault()

  const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)

  pasted.split('').forEach((char, i) => {
    otpDigits.value[i] = char
  })

  const focusIdx = Math.min(pasted.length, 5)

  focusOtpInput(focusIdx)

  if (pasted.length === 6)
    handleSubmit()
}

function focusOtpInput(index) {
  nextTick(() => {
    otpRefs.value[index]?.$el?.querySelector('input')?.focus()
    || otpRefs.value[index]?.focus()
  })
}

async function handleSubmit() {
  errorMessage.value = ''
  infoMessage.value = ''
  isSubmitting.value = true

  const trimmedPhone = phoneNumber.value.trim()

  try {
    if (isRequestStep.value) {
      await authenticateAdmin(trimmedPhone)
      step.value = 'verify'
      infoMessage.value = 'Verification code has been sent to your number.'
      nextTick(() => {
        focusOtpInput(0)
        requestWebOtp()
      })
    }
    else {
      await verifyAdminCode({
        phoneNumber: trimmedPhone,
        verificationCode: verificationCode.value,
      })

      const { isAuthenticated, role } = await checkAuthStatus()

      if (isAuthenticated) {
        await router.push('/dashboard')
      }
      else {
        errorMessage.value = 'Authentication failed. Please try again.'
      }
    }
  }
  catch (error) {
    errorMessage.value
      = error?.response?.data?.detail
        || error?.response?.data?.message
        || 'Login is not possible. Please try again.'
  }
  finally {
    isSubmitting.value = false
  }
}

function handleChangePhone() {
  step.value = 'request'
  otpDigits.value = ['', '', '', '', '', '']
  errorMessage.value = ''
  infoMessage.value = ''
  webOtpAbort?.abort()
}

onUnmounted(() => {
  webOtpAbort?.abort()
})
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-slate-50">
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_10%_-10%,rgba(255,204,128,0.35),transparent_60%),radial-gradient(800px_circle_at_90%_10%,rgba(125,170,238,0.25),transparent_65%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)]" />
    <div class="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full bg-amber-200/50 blur-3xl" />
    <div class="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-sky-200/45 blur-3xl" />
    <div class="pointer-events-none absolute top-16 right-[12%] hidden h-32 w-32 rounded-3xl border border-slate-200/70 bg-white/50 shadow-sm backdrop-blur-sm lg:block" />
    <div class="pointer-events-none absolute bottom-20 left-[12%] hidden h-20 w-20 rounded-2xl border border-amber-200/60 bg-white/60 shadow-sm backdrop-blur-sm lg:block" />

    <div class="relative flex min-h-screen items-center justify-center px-6 py-6 sm:py-10">
      <VCard class="w-full max-w-110 rounded-3xl border border-slate-200/70 bg-white/90 shadow-[0_32px_90px_rgba(15,23,42,0.18)] backdrop-blur">
        <div class="px-8 pt-8">
          <RouterLink
            to="/"
            class="login-logo flex flex-col items-center gap-3 text-slate-900 no-underline"
          >
            <!-- eslint-disable vue/no-v-html -->
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-200/70 text-amber-700 shadow-sm">
              <div
                class="h-6 w-6"
                v-html="logo"
              />
            </div>
            <h1 class="text-lg font-semibold tracking-tight">
              Bellucci Gold
            </h1>
          </RouterLink>
        </div>

        <VCardText class="px-8 pt-6 text-center">
          <VChip
            class="mb-4 bg-amber-100/70! text-amber-700!"
            size="small"
            variant="tonal"
          >
            Staff Panel
          </VChip>
          <h2 class="text-xl font-semibold text-slate-900">
            Login to Management Dashboard
          </h2>
          <p class="mt-2 text-sm leading-6 text-slate-500">
            Enter your mobile number to receive a one-time code.
          </p>
        </VCardText>

        <VCardText class="px-8 pb-8">
          <VForm @submit.prevent="handleSubmit">
            <div class="space-y-4">
              <VTextField
                v-model="phoneNumber"
                autofocus
                label="Mobile Number"
                type="tel"
                dir="ltr"
                placeholder="09xxxxxxxxx"
                hint="e.g. 09123456789"
                persistent-hint
                variant="outlined"
                density="comfortable"
                class="rounded-2xl"
                :disabled="isVerifyStep"
              />

              <div
                v-if="isVerifyStep"
                class="space-y-2"
              >
                <label class="text-xs font-medium text-slate-500">Verification Code</label>
                <div
                  class="otp-container flex justify-center gap-2.5"
                  dir="ltr"
                  @paste="handleOtpPaste"
                >
                  <VTextField
                    v-for="(_, i) in 6"
                    :key="i"
                    :ref="el => otpRefs[i] = el"
                    v-model="otpDigits[i]"
                    variant="outlined"
                    density="comfortable"
                    inputmode="numeric"
                    maxlength="2"
                    :autocomplete="i === 0 ? 'one-time-code' : 'off'"
                    class="otp-input text-center"
                    :class="{ 'otp-input--filled': otpDigits[i], 'otp-input--active': i === nextEmptyIndex }"
                    hide-details
                    @input="handleOtpInput(i, $event)"
                    @keydown="handleOtpKeydown(i, $event)"
                  />
                </div>
                <p class="text-center text-xs text-slate-400">
                  Enter the 6-digit code sent to you
                </p>
              </div>

              <VAlert
                v-if="errorMessage"
                type="error"
                variant="tonal"
                class="rounded-2xl text-sm"
              >
                {{ errorMessage }}
              </VAlert>
              <VAlert
                v-if="infoMessage"
                type="success"
                variant="tonal"
                class="rounded-2xl text-sm"
              >
                {{ infoMessage }}
              </VAlert>

              <VBtn
                block
                type="submit"
                :loading="isSubmitting"
                :disabled="!canSubmit"
                class="h-12 w-full rounded-2xl bg-slate-900! text-white! shadow-lg shadow-slate-900/25 hover:bg-slate-800!"
              >
                {{ isRequestStep ? 'Send Code' : 'Verify and Login' }}
              </VBtn>

              <VBtn
                v-if="isVerifyStep"
                variant="outlined"
                class="h-11 w-full rounded-2xl border-slate-200! text-slate-700! hover:bg-slate-100!"
                @click="handleChangePhone"
              >
                Change Mobile Number
              </VBtn>
            </div>
          </VForm>
        </VCardText>
      </VCard>
    </div>
  </div>
</template>

<style scoped>
.login-logo svg {
  width: 24px;
  height: 24px;
}

.otp-input {
  width: 48px !important;
  min-width: 48px !important;
}

.otp-input :deep(.v-field) {
  border-radius: 14px;
  text-align: center;
  transition:
    border-color 0.2s,
    box-shadow 0.2s,
    background-color 0.2s;
}

.otp-input :deep(.v-field__input) {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0;
  text-align: center;
  caret-color: transparent;
  padding: 0;
}

.otp-input--filled :deep(.v-field) {
  border-color: rgb(245 158 11);
  background-color: rgb(255 251 235 / 0.6);
}

.otp-input :deep(.v-field:hover) {
  border-color: rgb(209 213 219);
}

.otp-input--active :deep(.v-field) {
  border-color: rgb(15 23 42);
  box-shadow: 0 0 0 2px rgb(15 23 42 / 0.08);
}

@media (max-width: 400px) {
  .otp-input {
    width: 42px !important;
    min-width: 42px !important;
  }
}
</style>

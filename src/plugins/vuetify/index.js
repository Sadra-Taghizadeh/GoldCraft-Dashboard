import { createVuetify } from 'vuetify'
import { VBtn } from 'vuetify/components/VBtn'
import { fa } from 'vuetify/locale'
import defaults from './defaults'
import { icons } from './icons'
import { themes } from './theme'

// Styles
import '@core/scss/template/libs/vuetify/index.scss'
import 'vuetify/styles'

export default function (app) {
  const vuetify = createVuetify({
    aliases: {
      IconBtn: VBtn,
    },
    defaults,
    icons,
    locale: {
      locale: 'fa',
      fallback: 'en',
      messages: { fa },
      rtl: {
        fa: true,
      },
    },
    theme: {
      defaultTheme: 'light',
      themes,
    },
  })

  app.use(vuetify)
}

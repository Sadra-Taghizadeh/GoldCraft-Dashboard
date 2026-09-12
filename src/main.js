import { registerPlugins } from '@core/utils/plugins'
import { createApp } from 'vue'
import App from '@/App.vue'
import { vPersianConvert } from './directives/persianConvert'

// Styles
import '@core/scss/template/index.scss'
import '@layouts/styles/index.scss'
import '@styles/styles.scss'
import '@styles/tailwind.css'

document.documentElement.setAttribute('dir', 'rtl')
document.documentElement.setAttribute('lang', 'fa')

// Create vue app
const app = createApp(App)

// Register plugins
registerPlugins(app)

// Register directives
app.directive('persian-convert', vPersianConvert)

// Mount vue app
app.mount('#app')

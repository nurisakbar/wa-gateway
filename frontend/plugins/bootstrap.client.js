import { defineNuxtPlugin } from '#app'
import { BootstrapVue3 } from 'bootstrap-vue-3'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(BootstrapVue3)
}) 
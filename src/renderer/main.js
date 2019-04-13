import Vue from 'vue'
import VueProgress from 'vue-progress-path'
import axios from 'axios'

import App from './App'

import 'vue-progress-path/dist/vue-progress-path.css'

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false

Vue.use(VueProgress)

/* eslint-disable no-new */
new Vue({
  components: {App},
  template: '<App/>'
}).$mount('#app')

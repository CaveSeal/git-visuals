import axios from 'axios'
import ElementUI from 'element-ui'
import Vue from 'vue'
import locale from 'element-ui/lib/locale/lang/en'

import 'element-ui/lib/theme-chalk/index.css'

import App from './App'

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false

Vue.use(ElementUI, {locale})

/* eslint-disable no-new */
new Vue({
  components: {App},
  template: '<App/>'
}).$mount('#app')

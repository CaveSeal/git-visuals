import Vue from 'vue'
import axios from 'axios'

import App from './App'
import git from './git/git'

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false

git.log().on('data', (chunk) => {
  console.log(chunk)
})

/* eslint-disable no-new */
new Vue({
  components: {App},
  template: '<App/>'
}).$mount('#app')

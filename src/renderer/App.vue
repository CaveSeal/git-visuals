<template>
  <div id="app">
    <el-container>
      <el-header height="35px" class="window-frame"></el-header>
      <el-container id="content">
        <app-sidebar span="250px" v-on:select="select"></app-sidebar>
        <el-container>
          <el-header>
            <app-header v-on:change="change"></app-header>
          </el-header>
          <el-main>
            <div class="pillar"></div>
            <div id="charts">
              <div ref="chart" id="chart"></div>
              <div ref="overview" id="overview"></div>
            </div>
            <div class="pillar"></div>
          </el-main>
          <el-footer>
            <app-footer></app-footer>
          </el-footer>
        </el-container>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import Footer from './view/components/Footer'
import Header from './view/components/Header'
import Sidebar from './view/components/Sidebar'

import force from './view/charts/force'
import overview from './view/overview'
import { Loading } from 'element-ui'
import Repository from './db/git/repository'
import formatDate from './db/util/format-date'

export default {
  components: {
    'app-footer': Footer,
    'app-header': Header,
    'app-sidebar': Sidebar
  },
  data () {
    return {
      chart: null,
      repo: null,
      repos: {}
    }
  },
  mounted () {
  },
  methods: {
    change (value) {
    },

    select (path) {
      let repo = this.repos[path]
      if (!repo) {
        repo = Repository({cwd: path})
        this.repos[path] = repo
      }

      if (this.chart) this.chart.destroy()

      this.chart = overview({
        ref: this.$refs.overview,
        margin: [20, 20, 20, 20]
      })

      let loading = null
      if (!repo.get('ready')) {
        loading = Loading.service({
          target: '#content',
          text: 'Please wait while the repository loads.'
        })
      }

      this.chart.on('selection', (data) => {
        const dates = data.map(date => formatDate(date))

        if (!this.force) {
          this.force = force({
            height: this.$refs.chart.clientHeight,
            id: this.$refs.chart.id,
            margin: [20, 20, 20, 20],
            width: this.$refs.chart.clientWidth
          })
        }

        this.force.update(repo.hierarchy(dates[0]))
      })

      repo.on('ready', () => {
        if (loading) loading.close()
        const data = repo.summaryByDate('d')
        this.chart.update(data)
      })
      repo.check()

      this.repo = repo
    }
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css?family=Abel');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Abel', sans-serif;
}

#app {
  height: 100vh;
  width: 100vw;
}

#charts {
  background-color: #eee;
  border-radius: 5px;
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

#charts > #chart {
  flex: 1;
}

#charts > #overview {
  min-height: 100px;
}

.el-header {
  background-color: #393e46;
}

.el-header,
.el-main,
.el-footer {
  padding: 0;
}

.date-picker {
  align-items: center;
  display: flex;
  height: 100%;
}

.el-main {
  background-color: #393e46;
  display: flex;
}

.el-main .pillar {
  background-color: #393e46;
  flex: 0 0 auto;
  width: 20px;
}

.el-container {
  height: 100%
}

.el-progress-bar__outer{
  background: #ddd;
  border-radius: 5px 5px 0px 0px;
}

.el-progress-bar__inner {
  background-color: #4ecca3;
  border-radius: 0px;
}

.window-frame {
  -webkit-app-region: drag;
}
</style>

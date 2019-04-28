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
              <div ref="legend" id="legend"></div>
              <div id="compare">
                <div ref="before" id="chart-left"></div>
                <div ref="after" id="chart-right"></div>
              </div>
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

import Force from './view/charts/force'
import Legend from './view/legend'
import Overview from './view/overview'
import { Loading } from 'element-ui'
import Repository from './db/repository'
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
  methods: {
    change (value) {
    },

    select (path) {
      let repo = this.repos[path]
      if (!repo) {
        repo = Repository({cwd: path})
        this.repos[path] = repo
      }

      if (this.overview) this.overview.destroy()

      this.overview = Overview({
        ref: this.$refs.overview,
        margin: [20, 20, 20, 20]
      })

      this.legend = Legend({
        ref: this.$refs.legend,
        values: repo.get('authors')
      })

      let loading = null
      if (!repo.get('ready')) {
        loading = Loading.service({
          target: '#content',
          text: 'Please wait while the repository loads.'
        })
      }

      // Clean up force graphs.
      if (this.after) this.after.destroy()
      this.after = null

      if (this.before) this.before.destroy()
      this.before = null

      // Update force graphs on selection change.
      this.overview.on('selection', (data) => {
        const dates = data.map(date => formatDate(date))

        if (!this.before) {
          this.before = Force({
            legend: this.legend,
            ref: this.$refs.before
          })
        }
        this.before.update(repo.hierarchy(dates[0]))

        if (!this.after) {
          this.after = Force({
            legend: this.legend,
            ref: this.$refs.after
          })
        }
        this.after.update(repo.hierarchy(dates[1]))
      })

      repo.on('ready', () => {
        if (loading) loading.close()

        const data = repo.summaryByDate('d')
        this.overview.update(data)
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

#charts > #compare {
  display: flex;
  flex: 1;
  flex-direction: row;
}

#charts > #overview {
  min-height: 100px;
}

#charts > #legend {
  height: 200px;
  left: 2%;
  width: 100px;
  position: absolute;
  overflow: auto;
  top: 2%;
}

#chart-left,
#chart-right {
  border-bottom: 1px solid #ccc;
  flex: 1;
  height: 100%;
  overflow: hidden;
}

#chart-left {
  border-right: 1px solid #ccc;
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

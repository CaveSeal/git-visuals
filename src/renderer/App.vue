<template>
  <div id="app">
    <el-container>
      <el-header height="35px" class="window-frame"></el-header>
      <el-container>
        <app-sidebar span="350px" v-on:select="onSelect"></app-sidebar>
        <el-container>
          <el-header>
            <app-header></app-header>
          </el-header>
          <el-main>
            <div class="pillar"></div>
            <app-viewer :paused="paused" :repo="repo"></app-viewer>
            <div class="pillar"></div>
          </el-main>
          <el-footer>
            <app-footer v-on:paused="paused = $event"></app-footer>
          </el-footer>
        </el-container>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import Footer from './components/Footer'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Viewer from './components/Viewer'

import Repository from './git/repository'

export default {
  name: 'git-visuals',
  components: {
    'app-footer': Footer,
    'app-header': Header,
    'app-sidebar': Sidebar,
    'app-viewer': Viewer
  },
  data () {
    return {
      paused: true,
      repo: null,
      repos: {}
    }
  },
  methods: {
    onSelect (path) {
      let repo = this.repos[path]
      if (!repo) {
        repo = new Repository(path)
        this.repos[path] = repo
      }
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

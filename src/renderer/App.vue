<template>
  <div id="app">
    <el-container>
      <el-header height="35px" class="window-frame">
      </el-header>
      <el-container>
        <el-aside width="300px">
          <div class="add-repository">
            <el-button type="primary" icon="el-icon-plus" @click="explore()" circle></el-button>
            <span>Add a repository</span>
          </div>
          <div class="repositories">
            <span>Repositories</span>
            <div v-for="repo in repos" @click="choose(repo)" v-bind:class="{active: active(repo)}">
              {{ repo.name }}
            </div>
          </div>
        </el-aside>
        <el-container>
          <el-header>
            <div class="date-picker">
              <el-date-picker
                v-model="range"
                type="daterange"
                range-separator="To"
                start-placeholder="Start date"
                end-placeholder="End date"
                :picker-options="options">
              </el-date-picker>
            </div>
          </el-header>
          <el-main>
            <div class="pillar"></div>
            <div class="content">
              <div ref="box" id="draw"></div>
              <el-progress :show-text="false" :stroke-width="8" :percentage="progress"></el-progress>
            </div>
            <div class="pillar"></div>
          </el-main>
          <el-footer>
            <el-button size="mini" round @click="toggle">Play</el-button>
          </el-footer>
        </el-container>
      </el-container>
    </el-container>
  </div>
</template>

<script>
  import ForceGraph from './viz/force-graph'
  import {ipcRenderer} from 'electron'
  import Repo from './git/repo'

  export default {
    name: 'git-visuals',
    data: function () {
      return {
        box: '',
        delay: 1000,
        endDate: null,
        height: 0,
        options: {
          disabledDate: (time) => {
            if (!this.selected) return false
            return time.getTime() < this.startDate || time.getTime() > this.endDate
          }
        },
        paused: true,
        progress: 0,
        range: '',
        repos: [],
        selected: null,
        startDate: null,
        viz: null,
        width: 0
      }
    },
    created: function () {
      ipcRenderer.on('repository', (event, path) => {
        if (!path) {
          return
        }
        this.repos.push(new Repo(path[0]))
      })
    },
    mounted: function () {
      this.box = '#' + this.$refs.box.id
      this.height = this.$refs.box.clientHeight
      this.width = this.$refs.box.clientWidth
    },
    methods: {
      active (repo) {
        if (!repo || !this.selected) return false
        return repo.name === this.selected.name
      },
      choose (repo) {
        this.selected = repo
        this.selected.bind()
        this.startDate = repo.getStartDate()
        this.endDate = repo.getEndDate()

        if (this.viz) {
          this.viz.destroy()
          this.viz = null
        }

        this.viz = new ForceGraph({
          height: this.height,
          element: this.box,
          width: this.width
        })

        let tree = this.selected.recent()
        if (tree) {
          this.viz.update(tree.root)
        } else {
          this.selected.on('update', () => {
            this.progress = this.selected.progress

            tree = this.selected.recent()
            if (tree) this.viz.update(tree.root)
          })
          this.selected.next()
        }

        if (this.iid) {
          clearInterval(this.iid)
        }

        this.iid = setInterval(this.loop, this.delay)
      },
      explore () {
        ipcRenderer.send('select', () => {
          // Send an event to ipc main.
        })
      },
      loop () {
        if (!this.paused) {
          this.paused = true

          this.selected.next()

          this.paused = false
        }
      },
      toggle (event) {
        this.paused = !this.paused
        event.srcElement.innerText = this.paused ? 'Play' : 'Pause'
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

  .el-button--primary, .el-footer .el-button {
    background-color: #393e46;
    border: none;
    color: #eee;
  }

  .el-button:hover, .el-button:active {
    background-color: #4ecca3;
  }

  .date-picker {
    align-items: center;
    display: flex;
    height: 100%;
  }

  .el-date-editor {
    width: 100%;
  }

  .el-date-editor, .el-date-editor .el-range-input {
    background-color: #393e46;
    border: none;
    color: #ccc;
    font-family: 'Abel', sans-serif;
  }

  .el-date-editor .el-range-separator {
    color: #ccc;
    width: 6%;
  }

  .el-header, .el-footer {
    background-color: #393e46;
  }

  .el-header {
    border-top: 1px solid #333;
  }

  .el-footer {
    padding: 16px 24px;
  }

  .el-aside {
    background-color: #232931;
    color: #ddd;
    font-size: 16px;
  }

  .el-footer .el-button {
    width: 70px;
  }

  .add-repository {
    padding: 12px 24px;
  }

  .repositories {
    padding: 32px;
  }

  .add-repository {
    border-bottom: 1px solid #393e46;
  }

  .add-repository span {
    margin: 0px 8px;
  }

  .repositories div {
    background-color: #393e46;
    border-radius: 5px;
    cursor: pointer;
    margin-top: 8px;
    padding: 4px 18px;
  }

  .repositories div:hover, .repositories div.active {
    background-color: #4ecca3;
  }
  
  .el-main {
    background-color: #393e46;
    display: flex;
    padding: 0;
  }
  
  .el-main .content {
    background-color: #fff;
    border-radius: 5px;
    display: flex;
    flex: 1;
    flex-direction: column;
  }

  .el-main #draw {
    flex: 1;
  }

  .el-main .pillar {
    background-color: #393e46;
    flex: 0 0 auto;
    width: 20px;
  }
  
  .el-container {
    height: 100%
  }

  .el-progress-bar__outer {
    background: #ddd;
    border-radius: 0px 0px 5px 5px;
  }

  .el-progress-bar__inner {
    background: #4ecca3;
    border-radius: 0px;
  }

  .window-frame {
    -webkit-app-region: drag;
  }
</style>

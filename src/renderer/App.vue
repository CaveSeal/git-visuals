<template>
  <div id="app">
    <header id="top">
      <div class="header-left">
        <h1>Git Visuals</h1>
        <span>{{ ('{' + name + '}') }}</span>
        <div>
          <loading-progress
            v-if="progress"
            :progress="progress"
            shape="line"
            size="140"
            height="20"
            width="140"/>
        </div>
      </div>
    </header>
    <main id="content">
      <!-- <force-graph :graph="graph"></force-graph> -->
      <div ref="box" id="draw">
        <!-- svg here -->
      </div>
    </main>
    <footer id="bot">
      <button class="alt" @click="open()">Repository</button>
      <button class="alt" @click="show()">Show Tree</button>
    </footer>
  </div>
</template>

<script>
  import {chdir} from 'process'
  import cloneDeep from 'lodash.clonedeep'
  import ForceGraph from './viz/force-graph'
  import git from './git/git'
  import {ipcRenderer} from 'electron'
  import moment from 'moment'
  import tree from './git/tree'

  export default {
    name: 'git-visuals',
    components: {},
    data: function () {
      return {
        after: '',
        before: '',
        name: 'Select a repository',
        paused: true,
        progress: null,
        timespan: []
      }
    },
    computed: {
      dates: function () {
        const dates = Object.keys(this.snapshots)

        return dates
          .map((d) => moment(d, 'YYYY-MM-DD'))
          .sort((a, b) => a - b)
          .map((d) => d.format('YYYY-MM-DD'))
      },
      snapshots: function () {
        const snaps = {}

        let [from, to] = this.timespan

        snaps[from] = null
        from = moment(from, 'YYYY-MM-DD')
        from.add(1, 'month')

        snaps[to] = null
        to = moment(to, 'YYYY-MM-DD')

        while (from.isBefore(to)) {
          snaps[from.format('YYYY-MM-01')] = null
          from.add(1, 'month')
        }
        return snaps
      }
    },
    created: function () {
      let after = ''
      let before = ''

      // Update viz on each iteration.
      this.iid = setInterval(function () {
        if (!this.paused) {
          this.paused = true

          after = before || this.dates[0]
          let i = this.dates.indexOf(after) + 1
          before = this.dates[i]

          this.log(after, before)

          const values = Object.values(this.snapshots)
          const total = values.length
          const count = values.filter((value) => value !== null).length
          this.progress = count / total

          if (this.dates.length === (i + 1)) {
            clearInterval(this.iid)
          }
        }
      }.bind(this), 1000)
    },
    mounted: function () {
      this.viz = new ForceGraph({
        height: this.$refs.box.clientHeight,
        element: '#draw',
        width: this.$refs.box.clientWidth
      })
    },
    methods: {
      chdir (path) {
        try {
          chdir(path)
        } catch (error) {
          console.error(error)
        }
      },
      log (after, before) {
        const log = git.log({
          format: {
            author: '%an',
            date: '%ad',
            message: '%s'
          },
          after: after,
          before: before
        })

        let dates = this.dates.slice().reverse()
        log.on('data', (chunk) => {
          const commits = JSON.parse(chunk.toString())

          for (let i = 0; i < commits.length; ++i) {
            const commit = commits[i]

            tree.update(commit)
            const date = moment(commit.date, 'YYYY-MM-DD')

            const month = dates
              .find((d) => moment(d, 'YYYY-MM-DD').isBefore(date))

            if (!this.snapshots[month]) {
              this.snapshots[month] = cloneDeep(tree)
            }
          }
        })

        log.on('finish', () => {
          this.update(tree.root)
          this.paused = false
        })
      },
      open () {
        // TODO: Reset all variables
        ipcRenderer.on('folderData', (event, paths) => {
          if (!paths || paths.length > 1) {
            return
          }
          let [path] = paths
          this.chdir(path)

          this.name = git.name
          tree.name = this.name
          this.timespan = [git.from, git.to]
          this.paused = false
        })
        ipcRenderer.send('openFolder', () => {
          // Send an event to ipc main.
        })
      },
      show () {
        console.log(tree)
      },
      update (data) {
        this.viz.update(data)
      }
    }
  }
</script>

<style>
  @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Source Sans Pro', sans-serif;
  }

  #app {
    background:
      radial-gradient(
        ellipse at top left,
        rgba(255, 255, 255, 1) 40%,
        rgba(229, 229, 229, .9) 100%
      );
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
  }

  #top, #bot {
    display: flex;
    flex: 1;
    align-items: center;
    padding: 0em 2em;
  }

  .header-left {
    display: flex;
    flex-flow: column;
    height: 100%;
    padding: 16px 0px;
  }

  .header-left div h1 {
    flex: 1;
    height: 100%;
  }

  #top h1 {
    color: #4fc08d;
  }

  #top span {
    color: #b4b4b4;
    font-size: 1.0rem;
    padding: 0px 4px;
    margin-bottom: 2px;
  }

  #top div, #bot div {
    flex: 1;
  }

  #content {
    flex: 6;
  }

  #content #draw {
    height: 100%;
    width: 100%;
  }

  #bot button {
    font-size: .8em;
    cursor: pointer;
    outline: none;
    padding: 0.75em 2em;
    margin: 0em 0.25em;
    border-radius: 2em;
    display: inline-block;
    color: #fff;
    background-color: #4fc08d;
    transition: all 0.15s ease;
    box-sizing: border-box;
    border: 1px solid #4fc08d;
  }

  .doc button.alt {
    color: #42b983;
    background-color: transparent;
  }
</style>

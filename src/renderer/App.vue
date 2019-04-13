<template>
  <div id="app">
    <header id="top">
      <div class="header-left">
        <h1>Git Visuals</h1>
        <loading-progress :progress="progress" shape="line" size="140" height="20" width="140"/>
      </div>
    </header>
    <main id="content">
      <div ref="box" id="draw">
        <!-- svg here -->
      </div>
    </main>
    <footer id="bot">
      <button class="alt" @click="open()">Repository</button>
      <button class="alt" @click="toggle">Pause</button>
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
        element: '',
        height: 0,
        name: '',
        paused: true,
        progress: 0,
        interval: 5000,
        timespan: [],
        width: 0
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
    mounted: function () {
      this.element = '#' + this.$refs.box.id
      this.height = this.$refs.box.clientHeight
      this.width = this.$refs.box.clientWidth
    },
    methods: {
      chdir (path) {
        try {
          chdir(path)
        } catch (error) {
          console.error(error)
        }
      },
      clear () {
        this.paused = true
        this.after = ''
        this.before = ''
        this.name = ''
        this.progress = 0
        this.timespan = []
        tree.clear()

        if (this.viz) {
          this.viz.destroy()
          this.viz = null
        }
      },
      draw () {
        const log = git.log({
          format: {
            author: '%an',
            date: '%ad',
            message: '%s'
          },
          after: this.after,
          before: this.before
        })

        log.on('data', (chunk) => {
          const commits = JSON.parse(chunk.toString())

          for (let i = 0; i < commits.length; ++i) {
            const commit = commits[i]

            tree.update(commit)

            if (this.snapshots[this.after] === null) {
              this.snapshots[this.after] = cloneDeep(tree)
            }
          }
        })

        log.on('finish', () => {
          if (this.viz) {
            this.viz.update(tree.root)
          }

          if (this.snapshots[this.after] === null) {
            delete this.snapshots[this.after]
          }

          if (this.dates[this.dates.length - 1] === this.before && this.snapshots[this.before] === null) {
            delete this.snapshots[this.before]
          }

          this.setProgress()
          this.paused = false
        })
      },
      loop () {
        if (this.iid) {
          clearInterval(this.iid)
        }

        this.iid = setInterval(this.update, this.interval)
      },
      open () {
        ipcRenderer.on('folderData', (event, paths) => {
          if (!paths || paths.length > 1) {
            return
          }
          let [path] = paths
          this.chdir(path)

          this.clear()

          this.name = git.name
          tree.name = this.name
          this.timespan = [git.from, git.to]

          this.viz = new ForceGraph({
            height: this.height,
            element: this.element,
            width: this.width
          })

          this.paused = false
          this.update()
          this.loop()
        })
        ipcRenderer.send('openFolder', () => {
          // Send an event to ipc main.
        })
      },
      setProgress () {
        const values = Object.values(this.snapshots)
        const count = values.filter((x) => !!x).length
        this.progress = count / values.length
      },
      toggle (e) {
        this.paused = !this.paused
        e.srcElement.innerText = this.paused ? 'Resume' : 'Pause'
      },
      update () {
        if (!this.paused && this.viz) {
          this.paused = true

          this.after = this.before || this.dates[0]
          let i = this.dates.indexOf(this.after) + 1
          this.before = this.dates[i]

          this.draw()

          if (this.dates.length === (i + 1)) {
            clearInterval(this.iid)
          }
        }
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
        rgba(229, 229, 229, .9) 100%);
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
    background-color: #4fc08d;
    border: 1px solid #4fc08d;
    border-radius: 2em;
    box-sizing: border-box;
    color: #fff;
    cursor: pointer;
    display: inline-block;
    font-size: .8em;
    outline: none;
    margin: 0em 0.25em;
    padding: 0.75em 2em;
    transition: all 0.15s ease;
    min-width: 120px;
  }

  .doc button.alt {
    color: #42b983;
    background-color: transparent;
  }
</style>

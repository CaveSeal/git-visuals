<template>
  <div id="app">
    <header id="top">
    </header>
    <main id="content">
      <force-graph :graph="graph"></force-graph>
    </main>
    <footer id="bot">
      <button class="alt" @click="open()">Repository</button>
    </footer>
  </div>
</template>

<script>
  import {chdir} from 'process'
  import cloneDeep from 'lodash.clonedeep'
  import ForceGraph from './components/ForceGraph'
  import git from './git/git'
  import {ipcRenderer} from 'electron'
  import moment from 'moment'
  import tree from './git/tree'

  function changeFolder (path) {
    try {
      chdir(path)
    } catch (error) {
      console.error(`chdir: ${error}`)
    }
  }

  export default {
    name: 'git-visuals',
    components: {
      'force-graph': ForceGraph
    },
    data: function () {
      return {
        graph: {links: [], nodes: []},
        dates: []
      }
    },
    methods: {
      open () {
        ipcRenderer.on('folderData', (event, paths) => {
          if (!paths || paths.length > 0) {
            // Do something...
          }
          let [path] = paths
          changeFolder(path)

          const duration = git.duration()

          let {start, end} = duration
          start = moment(start)
          end = moment(end)

          const snapshots = {}
          while (start.isBefore(end)) {
            snapshots[start.format('YYYY-MM-01')] = null
            start.add(1, 'month')
          }

          const log = git.log()

          log.on('data', (chunk) => {
            const data = JSON.parse(chunk.toString())
            data.forEach((value) => {
              tree.update(value)
              const month = moment(value.date).startOf('month').format('YYYY-MM-DD')
              if (!snapshots[month]) {
                snapshots[month] = cloneDeep(tree)
                console.log(snapshots)
              }
            })
            log.pause()
            this.draw()
          })
          log.on('finish', () => {
            console.log(tree)
          })
        })
        ipcRenderer.send('openFolder', () => {
          // Send an event to ipc main.
        })
      },
      draw () {
        this.graph = tree.graph
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

  #content {
    flex: 6;
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

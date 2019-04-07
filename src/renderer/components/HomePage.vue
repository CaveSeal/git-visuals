<template>
  <div id="wrapper">
    <header id="top"></header>
    <main id="content">
      <force-graph></force-graph>
    </main>
    <footer id="bot">
      <button class="alt" @click="open()">Repository</button>
    </footer>
  </div>
</template>

<script>
  import ForceGraph from './HomePage/ForceGraph'
  import {chdir} from 'process'
  import git from '../git/git'
  import {ipcRenderer} from 'electron'
  import tree from '../git/tree'

  ipcRenderer.on('folderData', (event, paths) => {
    if (paths !== null) {
      // If paths.length > 1, then error msg.
      try {
        chdir(paths[0])
      } catch (error) {
        console.error(`chdir: ${error}`)
      }
      git.log().on('data', (chunk) => {
        const data = JSON.parse(chunk.toString())
        data.forEach((commit) => tree.update(commit))
      })
    }
  })

  export default {
    name: 'home-page',
    components: { ForceGraph },
    methods: {
      open () {
        ipcRenderer.send('openFolder', () => {
          // Send an event to ipc main.
        })
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

  #wrapper {
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

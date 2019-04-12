<template>
  <div id="app">
    <header id="top">
      <div>
        <h1>Git Visuals</h1>
        <h3>{{ name }}</h3>
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
  import { Carousel, Slide } from 'vue-carousel'
  import {chdir} from 'process'
  import cloneDeep from 'lodash.clonedeep'
  // import * as d3 from 'd3'
  // import ForceGraph from './viz/force-graph'
  import git from './git/git'
  import {ipcRenderer} from 'electron'
  import moment from 'moment'
  // import Sunburst from './viz/sunburst'
  import tree from './git/tree'

  export default {
    name: 'git-visuals',
    components: {
      Carousel,
      Slide
    },
    data: function () {
      return {
        after: '',
        before: '',
        name: '',
        paused: true,
        timespan: []
      }
    },
    computed: {
      dates: function () {
        const dates = Object.keys(this.snapshots)

        return dates.map((d) => moment(d)).sort((a, b) => a - b)
      },
      snapshots: function () {
        const snaps = {}

        let [from, to] = this.timespan

        snaps[from] = null
        from = moment(from)
        from.add(1, 'month')

        snaps[to] = null
        to = moment(to)

        while (from.isBefore(to)) {
          snaps[from.format('YYYY-MM-01')] = null
          from.add(1, 'month')
        }
        return snaps
      }
    },
    created: function () {
      // Update viz on each iteration.
      this.iid = setInterval(function () {
        if (!this.paused) {
          this.after = this.before || this.dates[0]

          let i = this.dates.indexOf(this.after)
          this.before = !(++i) ? this.dates[1] : this.dates[i]

          if (!this.before) {
            clearInterval(this.iid)
            return
          }

          this.paused = true

          const log = git.log({
            format: {
              hash: '%h',
              date: '%ad',
              author: '%an',
              message: '%s'
            },
            after: this.after.format('YYYY MM DD'),
            before: this.before.format('YYYY MM DD')
          })

          console.log(this.after.format('YYYY MM DD'))

          log.on('data', (chunk) => {
            const data = JSON.parse(chunk.toString())

            data.forEach((commit) => {
              tree.update(commit)

              const month = moment(commit.date)
                .startOf('month').format('YYYY MM DD')
              const cache = !this.snapshots[month]

              if (cache) {
                this.snapshots[month] = cloneDeep(tree)
              }
            })
          })
          log.on('finish', () => {
            this.paused = false
          })
        }
      }.bind(this), 1000)
    },
    mounted: function () {
      // const height = this.$refs.box.clientHeight
      // const width = this.$refs.box.clientWidth

      // const svg = d3
      //   .select('#draw')
      //   .append('svg')
      //   .attr('width', width)
      //   .attr('height', height)

      // this.viz = new ForceGraph({
      //   height: height,
      //   svg: svg,
      //   width: width
      // })

      // Call when switching
      // d3.select('svg').remove();
    },
    methods: {
      chdir (path) {
        try {
          chdir(path)
        } catch (error) {}
      },
      open () {
        ipcRenderer.on('folderData', (event, paths) => {
          if (!paths || paths.length > 1) {
            return
          }
          let [path] = paths
          this.chdir(path)

          this.name = git.name
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
        // this.viz.update(data)
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

  #top h1 {
    color: #4fc08d;
  }

  #top div {
    flex: 1;
  }

  #top h3 {
    color: #b4b4b4;
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

<!--<div class="date-carousel">
  <carousel :mouse-drag="true" :paginationEnabled="false" :per-page="6">
    <slide v-for="date in dates" :key="date.format('YYYY-MM-DD')">
      <span class="line"></span>
      <span class="label">{{ date.format('ll') }}</span>
    </slide>
  </carousel>
</div>-->

// .date-carousel {
//   align-items: center;
//   display: flex;
//   height: 100%;
//   width: 100%;
// }

// .VueCarousel {
//   flex: 1;
//   margin: 0px 24px;
// }

// .VueCarousel-slide {
//   cursor: pointer;
//   min-height: 40px;
//   position: relative;
// }

// .label {
//   flex: 0 0 auto;
//   position: absolute;
//   color: #000;
//   font-size: 0.8rem;
//   position: absolute;
//   transform: translate(-50%, -50%);
//   left: 50%;
//   text-align: center;
//   top: 50%;
//   width: 60%;
//   height: 40px;
// }

// .label:after {
//   background: hsl(153, 47%, 49%);
//   border-radius: 50%;
//   content: '';
//   height: 10px;
//   width: 10px;
//   display: block;
//   padding: 0;
//   margin: 0 auto;
// }

// .line {
//   width: 100%;
//   background: hsl(153, 47%, 49%);
//   position: absolute;
//   height: 2px;
//   top: 50%;
// }

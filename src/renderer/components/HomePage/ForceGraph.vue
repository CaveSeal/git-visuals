<template>
  <div ref="box" id="force-graph">
    <!-- svg here -->
  </div>
</template>

<script>
  import * as d3 from 'd3'
  import ForceGraph from './force-graph'

  export default {
    name: 'force-graph',
    props: {
      // nodes: {
      //   type: Array
      // }
    },
    mounted () {
      const links = [
        { source: 2, target: 1, strength: 0.1 },
        { source: 3, target: 1, strength: 0.1 },
        { source: 4, target: 1, strength: 0.1 },
        { source: 5, target: 1, strength: 0.1 },
        { source: 6, target: 5, strength: 0.1 },
        { source: 7, target: 5, strength: 0.1 },
        { source: 8, target: 1, strength: 0.1 },
        { source: 9, target: 8, strength: 0.1 },
        { source: 10, target: 8, strength: 0.1 }
      ]

      const nodes = [
        { id: 1, label: '', group: 0, level: 1, size: 10 },
        { id: 2, label: 'package.json', group: 0, level: 2, size: 5 },
        { id: 3, label: 'README.md', group: 0, level: 2, size: 5 },
        { id: 4, label: 'gulpfile', group: 0, level: 2, size: 5 },
        { id: 5, label: 'src', group: 1, level: 1, size: 10 },
        { id: 6, label: 'index.js', group: 2, level: 2, size: 5 },
        { id: 7, label: 'main.js', group: 2, level: 2, size: 5 },
        { id: 8, label: 'tasks', group: 3, level: 1, size: 10 },
        { id: 9, label: 'build.js', group: 3, level: 2, size: 5 },
        { id: 10, label: 'clean.js', group: 3, level: 2, size: 5 }
      ]

      const height = this.$refs.box.clientHeight
      const width = this.$refs.box.clientWidth

      const svg = d3
        .select('#force-graph')
        .append('svg')
        .attr('width', width)
        .attr('height', height)

      const fg = new ForceGraph({
        height: height,
        svg: svg,
        width: width
      })

      fg.update(nodes, links)
    }
  }
</script>

<style scoped>
  #force-graph {
    width: 100%;
    height: 100%;
  }
</style>

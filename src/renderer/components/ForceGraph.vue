<template>
  <div ref="box" id="force-graph">
    <!-- svg here -->
  </div>
</template>

<script>
  import * as d3 from 'd3'
  import ForceGraph from './ForceGraph/force-graph'

  export default {
    name: 'force-graph',
    props: {
      graph: Object
    },
    watch: {
      graph: function (graph) {
        this.fg.update(graph.nodes, graph.links)
      }
    },
    mounted () {
      const height = this.$refs.box.clientHeight
      const width = this.$refs.box.clientWidth

      const svg = d3
        .select('#force-graph')
        .append('svg')
        .attr('width', width)
        .attr('height', height)

      this.fg = new ForceGraph({
        height: height,
        svg: svg,
        width: width
      })

      this.fg.update(this.graph.nodes, this.graph.links)
    }
  }
</script>

<style scoped>
  #force-graph {
    width: 100%;
    height: 100%;
  }
</style>

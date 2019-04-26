import assign from 'lodash.assign'
import * as d3 from 'd3'

const beeswarm = function () {
  const height = this.ref.clientHeight
  const radius = this.radius || 3
  const width = this.ref.clientWidth

  const svg = d3
    .select('#' + this.ref.id)
    .append('svg')
    .attr('height', height)
    .attr('width', width)

  let node = svg.append('g').selectAll('.node')

  const force = d3.forceSimulation()
    .force('y', d3.forceY(height / 2))
    .force('collide', d3.forceCollide().radius(d => radius + 0.5))
    .on('tick', ticked)

  function ticked () {
    node
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
  }

  return assign(this, {
    // Update the state of the beeswarm
    update: function (values) {
      const scale = d3.scaleLog()
        .domain(d3.extent(values, d => d.size))
        .range([0, width])

      force.nodes(values)
        .force('x', d3.forceX((d) => scale(d.size)).strength(0.2))
      force.restart()

      node = node.data(values, d => d.size)

      node = node
        .join(
          enter => enter
            .append('circle')
            .attr('r', _ => radius)
            .style('fill', _ => 'lightblue')
            .attr('cx', d => d.x)
            .attr('cy', d => d.y),
          exit => exit.remove()
        )
    }
  })
}

export default (target) => beeswarm.call(target)

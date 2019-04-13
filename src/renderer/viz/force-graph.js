import * as d3 from 'd3'
import { hierarchy } from 'd3-hierarchy'
import Viz from './viz'

class ForceGraph extends Viz {
  constructor (opts = {}) {
    super(opts)

    this.link = this.g.append('g').selectAll('.link')

    this.node = this.g.append('g').selectAll('.node')

    const linkForce = d3.forceLink()
      .id((d) => d.data.id)
      .distance(20)
      .strength((d) => d.target.data.children.length ? 0.2 : 0.7)

    this.simulation = d3
      .forceSimulation()
      .force('charge', d3.forceManyBody())
      .force('link', linkForce)
      .force('x', d3.forceX())
      .force('y', d3.forceY())
      .alphaTarget(1)
      .on('tick', this.tick)

    this.transition = d3.transition().duration(750)
  }

  tick = () => {
    this.node.attr('cx', (d) => d.x)
    this.node.attr('cy', (d) => d.y)
    this.link.attr('x1', (d) => d.source.x)
    this.link.attr('y1', (d) => d.source.y)
    this.link.attr('x2', (d) => d.target.x)
    this.link.attr('y2', (d) => d.target.y)
  }

  update (data) {
    const root = hierarchy(data)

    const color = d3.scaleOrdinal(d3.schemeCategory10)
    const links = root.links()
    const nodes = root.descendants()

    const scale = d3.scaleLinear()
      .range([3, 10])
      .domain(d3.extent(nodes, (d) => d.data.size))

    this.node = this.node
      .data(nodes, (d) => d.data.id)
      .join(
        enter => enter.append('circle')
          .style('fill-opacity', 1e-6)
          .call(enter => enter.transition(this.transition))
          .attr('r', (d) => scale(d.data.size))
          .attr('fill', (d) => color(d.data.author))
          .style('fill-opacity', 1),
        update => update,
        exit => exit
          .call(exit => exit.transition(this.transition))
          .style('fill-opacity', 1e-6)
          .remove()
      )

    this.link = this.link
      .data(links, (d) => d.source.data.id + '-' + d.target.data.id)
      .join(
        enter => enter.append('line')
          .attr('stroke-width', 1)
          .attr('stroke', '#000'),
        update => update,
        exit => exit.remove()
      )

    this.simulation.nodes(nodes)
    this.simulation.force('link').links(links)
    this.simulation.alpha(1).restart()
  }
}

export default ForceGraph

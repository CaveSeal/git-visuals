import * as d3 from 'd3'
import { hierarchy } from 'd3-hierarchy'
import Viz from './viz'

class ForceGraph extends Viz {
  constructor (opts = {}) {
    super(opts)

    this.link = this.g.append('g').selectAll('.link')
    this.node = this.g.append('g').selectAll('.node')
    this.text = this.g.append('g').selectAll('.text')

    const linkForce = d3.forceLink()
      .id((d) => d.data.id)
      .distance((d) => d.target.data.children.length ? 60 : 30)
      .strength((d) => d.target.data.children.length ? 0.2 : 0.7)

    this.force = d3
      .forceSimulation()
      .force('charge', d3.forceManyBody())
      .force('link', linkForce)
      .force('x', d3.forceX())
      .force('y', d3.forceY())
      .alphaTarget(1)
      .on('tick', this.tick)

    this.transition = d3.transition().duration(750)
    this.color = d3.scaleOrdinal(d3.schemePastel1)
  }

  hover () {
    d3.select(this).attr('fill-opacity', 1)
  }

  leave () {
    d3.select(this).attr('fill-opacity', 1e-6)
  }

  tick = () => {
    this.node.attr('cx', (d) => d.x)
    this.node.attr('cy', (d) => d.y)
    this.text.attr('x', (d) => d.x)
    this.text.attr('y', (d) => d.y)
    this.link.attr('x1', (d) => d.source.x)
    this.link.attr('y1', (d) => d.source.y)
    this.link.attr('x2', (d) => d.target.x)
    this.link.attr('y2', (d) => d.target.y)
  }

  update (data) {
    const root = hierarchy(data)

    const links = root.links()
    const nodes = root.descendants()

    const scale = d3.scaleLinear()
      .range([3, 12])
      .domain(d3.extent(nodes, (d) => d.data.size))

    this.link = this.link
      .data(links, (d) => d.source.data.id + '-' + d.target.data.id)
      .join(
        enter => enter.append('line')
          .attr('stroke-width', 1)
          .attr('stroke', '#ccc')
          .attr('stroke-opacity', 0.7),
        update => update,
        exit => exit.remove()
      )

    this.node = this.node
      .data(nodes, (d) => d.data.id)
      .join(
        enter => enter.append('circle')
          .attr('r', (d) => scale(d.data.size))
          .attr('fill', (d) => this.color(d.data.author))
          .attr('stroke', (d) => '#000'),
        exit => exit.remove()
      )

    this.text = this.text
      .data(nodes, (d) => d.data.id)
      .join(
        enter => enter.append('text')
          .attr('x', 12)
          .attr('dy', '.35em')
          .attr('fill-opacity', 1e-6)
          .text((d) => d.data.name)
          .on('mouseover', this.hover)
          .on('mouseleave', this.leave),
        exit => exit.remove()
      )

    this.force.nodes(nodes)
    this.force.force('link').links(links)
    this.force.alpha(1).restart()
  }
}

export default ForceGraph

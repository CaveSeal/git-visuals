import * as d3 from 'd3'
import { hierarchy } from 'd3-hierarchy'
import Viz from './viz'

class ForceGraph extends Viz {
  constructor (opts = {}) {
    super(opts)

    this.node = this.g.selectAll('.node')
    this.link = this.g.selectAll('.link')
    this.text = this.g.selectAll('.text')

    const linkForce = d3.forceLink()

    const center = d3
      .forceCenter(0, 0)

    const manyBody = d3
      .forceManyBody()
      .strength(-100)

    this.simulation = d3
      .forceSimulation()
      .force('link', linkForce)
      .force('charge', manyBody)
      .force('center', center)
      .on('tick', this.ticked)

    const zoom = d3.zoom()
      .on('zoom', this.zoom)

    zoom(this.svg)
  }

  ticked = () => {
    this.node.attr('cx', (d) => d.x)
    this.node.attr('cy', (d) => d.y)
    this.link.attr('x1', (d) => d.source.x)
    this.link.attr('y1', (d) => d.source.y)
    this.link.attr('x2', (d) => d.target.x)
    this.link.attr('y2', (d) => d.target.y)
    this.text.attr('x', (d) => d.x)
    this.text.attr('y', (d) => d.y)
  }

  update (data) {
    const root = hierarchy(data)

    const links = root.links()
    const nodes = root.descendants()

    const t = d3.transition().duration(750)

    const scale = d3.scaleLinear()
      .range([5, 15])
      .domain(d3.extent(nodes, (d) => d.data.size))

    this.node = this.node
      .data(nodes, (d) => d.data.id)

    this.node.exit()
      .style('fill', '#b26745')
      .transition(t)
      .attr('r', 1e-6)
      .remove()
    this.node = this.node.enter()
      .append('circle')
      .attr('r', (d) => scale(d.data.size ? d.data.size : 1))
      .attr('fill', 'rgba(175, 227, 19, 1)')
      .merge(this.node)

    this.link = this.link
      .data(links, (link) => link.target)

    this.link.exit().remove()

    this.link = this.link.enter()
      .append('line')
      .attr('stroke-width', 1)
      .attr('stroke', 'rgba(50, 50, 50, 0.2)')
      .merge(this.link)

    this.text = this.text
      .data(nodes, (d) => d.data.id)

    this.text.exit().remove()

    this.text = this.text.enter()
      .append('text')
      .text((d) => d.data.name)
      .attr('font-size', 15)
      .attr('dx', 15)
      .attr('dy', 4)
      .attr('fill', 'rgba(50, 50, 50, 0.2)')
      .merge(this.text)
  }

  zoom = () => {
    this.node.attr('transform', (d) => d3.event.transform)
    this.link.attr('transform', (d) => d3.event.transform)
    this.text.attr('transform', (d) => d3.event.transform)
  }
}

export default ForceGraph

import * as d3 from 'd3'

class ForceGraph {
  constructor (opts = {}) {
    if (!opts.svg) return

    const svg = opts.svg

    this.nodes = opts.nodes || []
    this.links = opts.links || []

    this.link = svg.append('g').selectAll('.link')
    this.node = svg.append('g').selectAll('.node')
    this.text = svg.append('g').selectAll('.text')

    const linkForce = d3
      .forceLink()
      .links(this.links)
      .id((d) => d.id)
      .strength((d) => d.strength)

    const center = d3
      .forceCenter(opts.width / 2, opts.height / 2)

    const manyBody = d3
      .forceManyBody()
      .strength(-120)

    this.simulation = d3
      .forceSimulation(this.nodes)
      .force('link', linkForce)
      .force('charge', manyBody)
      .force('center', center)
      .on('tick', this.ticked)
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

  update (nodes, links) {
    const t = d3.transition().duration(750)

    this.link = this.link
      .data(links, (link) => link.target + link.source)

    this.link.exit().remove()

    this.link = this.link.enter()
      .append('line')
      .attr('stroke-width', 1)
      .attr('stroke', 'rgba(50, 50, 50, 0.2)')
      .merge(this.link)

    this.node = this.node
      .data(nodes, (d) => d.id)

    this.node.exit()
      .style('fill', '#b26745')
      .transition(t)
      .attr('r', 1e-6)
      .remove()

    this.node = this.node.enter()
      .append('circle')
      .attr('r', (d) => d.size)
      .attr('fill', 'gray')
      .merge(this.node)

    this.text = this.text
      .data(nodes, (d) => d)

    this.text.exit().remove()

    this.text = this.text.enter()
      .append('text')
      .text((d) => d.label)
      .attr('font-size', 15)
      .attr('dx', 15)
      .attr('dy', 4)
      .merge(this.text)

    this.simulation
      .nodes(nodes)
      .force('link')
      .links(links)

    this.simulation.restart()
  }
}

export default ForceGraph

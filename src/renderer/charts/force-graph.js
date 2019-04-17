import * as d3 from 'd3'
import { hierarchy } from 'd3-hierarchy'
import Chart from './chart'

class ForceGraph extends Chart {
  constructor (opts = {}) {
    super(opts)

    const g = this.svg.append('g')
      .attr('transform', `translate(${this.width / 2},${this.height / 2})`)

    this.link = g.append('g').selectAll('.link')
    this.node = g.append('g').selectAll('.node')

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

  tick = () => {
    this.node.attr('cx', (d) => d.x)
    this.node.attr('cy', (d) => d.y)
    this.link.attr('x1', (d) => d.source.x)
    this.link.attr('y1', (d) => d.source.y)
    this.link.attr('x2', (d) => d.target.x)
    this.link.attr('y2', (d) => d.target.y)
  }

  update (data) {
    console.log(data)

    const root = hierarchy(data)

    const links = root.links()
    const nodes = root.descendants()

    const scale = d3.scaleLinear()
      .range([3, 12])
      .domain(d3.extent(nodes, (d) => d.data.a - d.data.d))

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
          .attr('stroke', (d) => '#000')
          .attr('r', (d) => scale(d.data.a - d.data.d))
          .attr('fill', (d) => this.color(d.data.author)),
        update => update
          .attr('fx', (d) => d.x)
          .attr('fy', (d) => d.y),
        exit => exit.remove()
      )

    this.force.nodes(nodes)
    this.force.force('link').links(links)
    this.force.alpha(1).restart()
  }
}

export default ForceGraph

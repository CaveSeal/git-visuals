import assignIn from 'lodash.assignin'
import * as d3 from 'd3'
import {EventEmitter} from 'events'

function force () {
  const [top, right, bottom, left] = this.margin

  let {height, width} = this

  const zoom = d3.zoom()
    .scaleExtent([1, 10])
    .on('zoom', () => g.attr('transform', d3.event.transform))

  const svg = d3
    .select(`#${this.id}`)
    .append('svg')
    .attr('height', height)
    .attr('width', width)
    .call(zoom)

  height -= (top + bottom)
  width -= (right + left)

  const g = svg.append('g')
    .attr('transform', `translate(${left},${top})`)

  let link = g.append('g').selectAll('.link')
  let node = g.append('g').selectAll('.node')

  let nodes = []
  let links = []

  const linkForce = d3.forceLink()
    .id((d) => d.data.id)
    .strength((d) => d.target.children && d.target.children.length ? 0.2 : 0.5)

  const tooltip = d3
    .select(`#${this.id}`)
    .append('div')
    .style('opacity', 0)
    .attr('class', 'tooltip')
    .style('background-color', '#393e46')
    .style('color', '#fff')
    .style('border-radius', '5px')
    .style('padding', '8px')
    .style('font-size', '0.8rem')
    .style('position', 'fixed')

  const ticked = () => {
    node.attr('cx', (d) => d.x)
    node.attr('cy', (d) => d.y)
    node.attr('fx', (d) => d.x)
    node.attr('fy', (d) => d.y)
    link.attr('x1', (d) => d.source.x)
    link.attr('y1', (d) => d.source.y)
    link.attr('x2', (d) => d.target.x)
    link.attr('y2', (d) => d.target.y)
  }

  const force = d3
    .forceSimulation()
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('charge', d3.forceManyBody().strength(-50))
    .force('link', linkForce)
    .force('x', d3.forceX())
    .force('y', d3.forceY())
    .alphaTarget(1)
    .on('tick', ticked)

  const color = d3.scaleOrdinal(d3.schemePastel1)

  const mousemove = function (d) {
    tooltip
      .html(`
        <span>
          Hello!
        </span>
      `)
      .style('opacity', 1)
      .style('left', `${d3.event.pageX}px`)
      .style('top', `${d3.event.pageY}px`)
  }

  const mouseleave = function (_) {
    tooltip.style('opacity', 0)
  }

  return assignIn(this, {
    // Update the state of the force graph
    update (values) {
      const root = d3.stratify()
        .id(d => d.name)
        .parentId(d => d.parent)(values)

      links = root.links()
      nodes = root.descendants()

      const scale = d3.scaleLinear()
        .domain(d3.extent(nodes, d => d.data.a - d.data.d))
        .range([3, 8])

      link = link
        .data(links, d => d.source.data.id + '-' + d.target.data.id)
        .join(
          enter => enter.append('line')
            .attr('stroke-width', 1)
            .attr('stroke', '#aaa')
            .attr('stroke-opacity', 0.7),
          update => update,
          exit => exit.remove()
        )

      node = node
        .data(nodes, d => d.data.name)
        .join(
          enter => enter.append('circle')
            .attr('stroke', _ => '#000')
            .attr('r', d => scale(d.data.a - d.data.d))
            .attr('fill', d => color(d.data.author))
            .on('mousemove', mousemove)
            .on('mouseleave', mouseleave)
            .call(d3.drag()),
          update => update,
          exit => exit.remove()
        )

      force.nodes(nodes)
      force.force('link').links(links)
      force.alpha(1).restart()
    },

    destroy () {
      d3.select(`#${this.id}`).selectAll('*').remove()
    }
  }, EventEmitter.prototype)
}

export default (target) => force.call(target)

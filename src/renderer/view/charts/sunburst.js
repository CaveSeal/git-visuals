import assign from 'lodash.assign'
import * as d3 from 'd3'

const beeswarm = function () {
  const height = this.ref.clientHeight
  const width = this.ref.clientWidth
  const radius = Math.min(width, height) / 2

  const svg = d3
    .select('#' + this.ref.id)
    .append('svg')
    .attr('height', height)
    .attr('width', width)
    .append('g')
    .attr('transform', 'translate(' + width / 2 + ',' + (height / 2) + ')')

  const color = d3.scaleOrdinal(d3.schemePastel1)

  return assign(this, {
    // Update the state of the beeswarm
    update: function (values) {
      const partition = d3.partition()
        .size([2 * Math.PI, radius * radius])

      let root = d3.stratify()
        .id(d => d.name)
        .parentId(d => d.parent)(values)

      root = d3.hierarchy(root).sum(d => d.size)

      partition(root)

      const arc = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .innerRadius(d => Math.sqrt(d.y0))
        .outerRadius(d => Math.sqrt(d.y1))

      svg.selectAll('path')
        .data(root.descendants())
        .enter()
        .append('path')
        .attr('display', d => d.depth ? null : 'none')
        .attr('d', arc)
        .style('stroke', '#fff')
        .style('opacity', 1)
        .style('fill', d => color((d.children ? d : d.parent).data.name))
    }
  })
}

export default (target) => beeswarm.call(target)

import assignIn from 'lodash.assignin'
import * as d3 from 'd3'

const legend = function () {
  const props = {}

  const svg = d3.select('#' + this.ref.id).append('svg')

  props.color = d3.scaleOrdinal()
    .domain(this.values)
    .range(d3.schemeSet2)

  svg.selectAll('.labels')
    .data(props.color.domain())
    .join(
      enter => enter
        .append('text')
        .attr('x', 30)
        .attr('y', (_, i) => 10 + i * 10)
        .style('fill', d => props.color(d))
        .text(d => d)
        .style('font-size', '0.5rem')
        .attr('text-anchor', 'left')
        .style('alignment-baseline', 'middle'),
      update => update
    )

  svg.selectAll('.colors')
    .data(props.color.domain())
    .join(
      enter => enter
        .append('circle')
        .attr('cx', 20)
        .attr('cy', (_, i) => 10 * i + 10)
        .attr('r', 2)
        .style('fill', d => props.color(d)),
      update => update
    )

  const [nodes] = svg.selectAll('*')._groups

  svg.attr('height', nodes[nodes.length - 1].cy.baseVal.value + 10)

  return assignIn(this, {
    // Define any methods.
    get: function (key) {
      return props[key]
    }
  })
}

export default (target) => legend.call(target)

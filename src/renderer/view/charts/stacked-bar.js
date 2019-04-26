import assignIn from 'lodash.assignin'

import * as d3 from 'd3'

const chart = function () {
  const [top, right, bottom, left] = this.margin

  let {height, width} = this

  const svg = d3
    .select(`#${this.id}`)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  height -= (top + bottom)
  width -= (right + left)

  const chart = svg.append('g')
    .attr('transform', `translate(${left},${top})`)

  const x = d3.scaleBand()
    .rangeRound([0, width])

  const y = d3.scaleLinear()
    .rangeRound([height, 0])

  const xAxis = d3.axisBottom()
    .scale(x)
    .tickFormat(d3.timeFormat('%Y'))

  const yAxis = d3.axisLeft().scale(y)

  const z = d3.scaleOrdinal(d3.schemeCategory10)

  const parseDate = d3.timeParse('%Y-%m-%d')

  return assignIn(this, {
    update: function (values) {
      const layers = d3.stack().keys(this.categories)(values)

      x.domain(layers[0].map(d => parseDate(d.data.date)))
      y.domain([0, d3.max(layers[layers.length - 1], d => (d[0] + d[1]))]).nice()

      const layer = chart
        .selectAll('.layer')
        .data(layers)
        .join(
          enter => enter
            .append('g')
            .style('fill', (d, i) => z(i))
        )

      layer.selectAll('.rect')
        .data(d => d)
        .join(
          enter => enter
            .append('rect')
            .attr('x', d => x(parseDate(d.data.date)))
            .attr('y', d => y(d[0] + d[1]))
            .attr('height', d => y(d[0]) - y(d[1] + d[0]))
            .attr('width', x.bandwidth() - 1)
        )

      chart.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis)

      chart.append('g').call(yAxis)
    }
  })
}

export default (target) => chart.call(target)

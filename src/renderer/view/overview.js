import assignIn from 'lodash.assignin'
import {EventEmitter} from 'events'

import * as d3 from 'd3'

const chart = function () {
  const margin = this.margin || [20, 20, 20, 20]
  const [top, right, bottom, left] = margin

  let width = this.ref.clientWidth
  let height = this.ref.clientHeight

  const svg = d3
    .select('#' + this.ref.id)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  height -= (top + bottom)
  width -= (right + left)

  const chart = svg.append('g')
    .attr('transform', `translate(${left},${top})`)

  const x = d3.scaleTime().range([0, width])
  const y = d3.scaleLinear().rangeRound([height, 0])

  const axis = d3.axisBottom(x)

  const parseDate = d3.timeParse('%Y-%m-%d')

  const brush = d3.brushX()
    .extent([[x.range()[0], 0], [x.range()[1], height]])
    .on('end', () => {
      if (!d3.event.sourceEvent || !d3.event.selection) return

      this.emit('selection', d3.event.selection.map(x.invert, x))
    })

  return assignIn(this, {
    update: function (values) {
      values.forEach(d => {
        d.date = parseDate(d.date)
      })

      const [min, max] = d3.extent(values, d => d.date)
      x.domain([min, max])
      y.domain([0, d3.max(values, d => d.total)]).nice()

      const ticks = d3.timeYears(min, max, 1)

      chart.selectAll('.rect')
        .data(values)
        .join(
          enter => enter
            .append('rect')
            .attr('x', d => x(d.date))
            .attr('y', d => y(d.total))
            .attr('height', d => height - y(d.total))
            .attr('width', 1)
        )

      chart.append('g')
        .call(brush)
        .selectAll('rect')
        .attr('y', -6)
        .attr('height', height)

      chart.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(axis.tickValues(ticks).tickFormat(d3.timeFormat('%Y')))
        .selectAll('text')
        .style('font-size', '0.5rem')
    },

    destroy () {
      d3.select('#' + this.ref.id).selectAll('*').remove()
    }
  }, EventEmitter.prototype)
}

export default (target) => chart.call(target)

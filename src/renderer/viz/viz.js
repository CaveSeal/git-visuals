import * as d3 from 'd3'

class Viz {
  constructor (opts = {}) {
    if (!opts.element) return

    this.element = opts.element
    this.height = opts.height || 0
    this.width = opts.width || 0

    this.svg = d3
      .select(this.element)
      .append('svg')
      .attr('height', this.height)
      .attr('width', this.width)

    this.g = this.svg.append('g')
      .attr('transform', `translate(${this.width / 2},${this.height / 2})`)
  }

  zoom = () => {}

  update (data) {
    // Nothing implemented
  }

  destroy () {
    d3.select(this.element).selectAll('*').remove()
  }
}

export default Viz

import * as d3 from 'd3'
import { hierarchy, partition } from 'd3-hierarchy'

class Sunburst {
  constructor (opts = {}) {
    if (!opts.svg) return

    this.svg = opts.svg

    this.w = opts.height || 0
    this.h = opts.width || 0
    const radius = Math.min(this.w, this.h) / 2

    this.path = this.svg.append('g')
      .selectAll('path')

    this.arc = d3.arc()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius / 2)
      .innerRadius(d => d.y0)
      .outerRadius(d => d.y1 - 1)

    this.partition = partition()
      .size([2 * Math.PI, radius * radius])
  }

  update (data) {
    data = hierarchy(data)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value)

    const root = this.partition(data)

    const color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, data.children.length + 1))

    this.path = this.path.data(root
      .descendants().filter((d) => d.depth))

    console.log(root)

    this.path = this.path.enter()
      .append('path')
      .attr('fill', (d) => {
        while (d.depth > 1) {
          d = d.parent
        }
        return color(d.data.name)
      })
      .attr('opacity', 1)
      .attr('d', this.arc)
      .merge(this.path)
  }
}

export default Sunburst

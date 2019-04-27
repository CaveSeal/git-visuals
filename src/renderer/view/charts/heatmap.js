import assignIn from 'lodash.assignin'
import * as d3 from 'd3'

const heatmap = function () {
  const height = this.ref.clientHeight
  const width = this.ref.clientWidth
  const gridSize = this.size || 100
  const tileSize = this.tileSize || 4

  const svg = d3
    .select('#' + this.ref.id)
    .append('svg')
    .attr('height', height)
    .attr('width', width)

  let x = d3.scaleBand()
    .range([0, gridSize])
    .domain(d3.range(0, gridSize, tileSize).map(n => n.toString()))
    .padding(0.01)

  let y = d3.scaleBand()
    .range([gridSize, 0])
    .domain(d3.range(0, gridSize, tileSize).map(n => n.toString()))
    .padding(0.01)

  if (this.subject) {
    this.subject.on('updateGrid', data => {
      let grid = []

      const scaleX = d3.scaleLinear()
        .range([1, gridSize])
        .domain(d3.extent(data, d => d.x))

      const scaleY = d3.scaleLinear()
        .range([1, gridSize])
        .domain(d3.extent(data, d => d.y))

      data.forEach(d => {
        grid.push({
          m: (Math.floor((gridSize - scaleX(d.x)) / tileSize) * tileSize),
          n: (Math.floor((gridSize - scaleY(d.y)) / tileSize) * tileSize),
          value: d.data.size
        })
      })

      this.update(grid)
    })
  }

  const color = d3.scaleLinear()
    .range(['white', '#69b3a2'])
    .domain([1, 100])

  return assignIn(this, {
    // Update the state of the heatmap
    update: function (values) {
      svg.selectAll()
        .data(values, d => d.m + '-' + d.n)
        .join(
          enter => enter
            .append('rect')
            .attr('x', d => d.m)
            .attr('y', d => d.n)
            .attr('width', x.bandwidth())
            .attr('height', y.bandwidth())
            .style('fill', d => color(d.value)),
          exit => exit.remove()
        )
    }
  })
}

export default (target) => heatmap.call(target)

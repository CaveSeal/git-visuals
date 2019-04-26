import moment from 'moment'

const range = function (start, stop, unit, format) {
  unit = moment.normalizeUnits(unit)

  const d0 = moment(start, format).startOf(unit)
  const d1 = moment(stop, format).startOf(unit)

  let dates = [d0.format(format)]
  d0.add(1, unit)

  while (d0.isBefore(d1)) {
    dates.push(d0.format(format))
    d0.add(1, unit)
  }
  dates.push(d1.format(format))
  return dates
}

export default range

import groupBy from 'lodash.groupby'
import has from 'lodash.has'
import moment from 'moment'

const fn = (arr) => groupBy(arr, x => {
  if (!has(x, 'date')) console.error('Must have date')
  return moment(x.date).startOf('d').format('YYYY-MM-DD')
})

export default fn

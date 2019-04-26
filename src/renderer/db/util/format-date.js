import isDate from 'lodash.isdate'

function formatDate (date) {
  if (!isDate(date)) return date

  const year = date.getFullYear()
  const month = (1 + date.getMonth()).toString()
  const day = date.getDate().toString()

  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

export default formatDate

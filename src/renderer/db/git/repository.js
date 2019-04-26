import assignIn from 'lodash.assignin'
import {basename} from 'path'
import database from '../db'
import defaults from 'lodash.defaults'
import {EventEmitter} from 'events'
import flatten from 'lodash.flatten'
import filter from 'lodash.filter'
import groupBy from 'lodash.groupby'
import groupByDate from '../util/group-by-date'
import Git from './git'
import keys from 'lodash.keys'
import moment from 'moment'
import range from '../util/date-range'
// import reduce from 'lodash.reduce'
import segments from '../util/segments'
import sumBy from 'lodash.sumby'
import unionBy from 'lodash.unionby'
import uniq from 'lodash.uniq'
import values from 'lodash.values'
import zipObject from 'lodash.zipobject'

const repository = function () {
  const props = {
    cwd: this.cwd || process.cwd()
  }
  const git = Git(props)

  const [start, finish] = git.duration.map(date => moment(date))
  let date = start.clone()

  props.authors = git.getAuthorInfo()
  props.endOf = start
  props.startOf = finish

  const db = database({
    name: basename(props.cwd)
  })
  db.table('info', {isObject: true})
  db.table('files', {key: 'name'})

  if (!db.use('info').has('date')) {
    db.set('date', date.format('YYYY-MM-DD'))
  }

  let [infoDate] = db.use('info').get(n => n)
  infoDate = moment(infoDate)

  git.on('logData', commits => {
    let items = []

    for (let i = 0; i < commits.length; ++i) {
      const commit = commits[i]
      db.use('info').update('date', (n) =>
        moment(n).isAfter(commit.date) ? n : commit.date)
      items = items.concat(parse(commit))
    }

    for (let i = 0; i < items.length; ++i) {
      db.use('files').mergeUpdate(items[i], merge)
    }
  })

  props.ready = false
  git.on('logDone', _ => {
    props.ready = true
    this.emit('ready')
  })

  git.log({after: infoDate.subtract(1, 'd').format('YYYY-MM-DD')})

  function parse (commit) {
    let items = []

    commit.files.forEach(file => {
      const paths = segments(file.name)

      let parent = null
      paths.forEach((name, index, array) => {
        const item = items.find(item => item.name === name)

        if (item) {
          updateModel(item, file)
        } else {
          const isFile = (index === array.length - 1)
          items.push(createModel(name, parent, file, commit, isFile))
        }
        parent = name
      })
    })
    return items
  }

  function updateModel (prev, next) {
    const [change] = prev.changes.slice(-1)
    change.a += next.a
    change.d += next.d
  }

  function createModel (name, parent, file, commit, isFile) {
    const model = {
      name: name,
      createdOn: commit.date,
      parent: parent || 'root',
      changes: [{
        author: commit.author,
        date: commit.date,
        hash: commit.hash,
        a: file.a,
        d: file.d,
        message: commit.message
      }]
    }

    if (file.binary) model.binary = true

    if (file.mode === 'delete' && isFile) {
      model.deletedOn = commit.date
    }

    return model
  }

  function merge (a, b) {
    if (Array.isArray(a) && Array.isArray(b)) {
      return unionBy(a, b, 'hash')
    }
  }

  /**
   * Returns the flattened 'files' table
   */
  function getFiles () {
    const changes = flatten(db.use('files').get(file =>
      file.changes.map(n => assignIn({}, n, {
        createdOn: file.createdOn,
        deletedOn: file.deletedOn,
        name: file.name,
        parent: file.parent
      }))))

    return changes
  }

  return assignIn(this, {
    check: function () {
      if (props.ready) this.emit('ready')
    },

    get: function (key) {
      return props[key]
    },

    diff: function (start, stop) {
      // Get the difference between two dates.
    },

    hierarchy: function (date) {
      date = moment(date, 'YYYY-MM-DD')

      let files = getFiles().filter(file => date.isSameOrAfter(file.date))

      files = values(groupBy(files, 'name'))

      files = files.map(file => {
        const a = sumBy(file, 'a')
        const d = sumBy(file, 'd')
        const recent = file[file.length - 1]
        return {
          name: recent.name,
          activity: file.length,
          author: recent.author,
          authors: uniq(file.map(revision => revision.author)),
          a: a,
          d: d,
          isBinary: recent.binary || false,
          createdOn: recent.createdOn,
          deletedOn: recent.deletedOn || null,
          lastChanged: recent.date,
          messages: file.map(revision => revision.message),
          parent: recent.parent,
          total: a + d
        }
      })
      files = filter(files, file =>
        !file.deletedOn && (file.total || file.isBinary))
      files.unshift({name: 'root', parent: ''})

      return files
    },

    summaryByDate: function (unit) {
      unit = moment.normalizeUnits(unit)

      const dates = groupByDate(flatten(getFiles()))

      const groups = range(start, finish, unit, 'YYYY-MM-DD')
        .map(date => ({date: date, a: 0, d: 0, total: 0}))

      keys(dates).forEach((key) => {
        const date = dates[key][0].date

        const startOf = moment(date).startOf(unit).format('YYYY-MM-DD')

        const a = sumBy(dates[key], 'a')
        const d = sumBy(dates[key], 'd')

        let group = groups.find(n => n.date === startOf)
        group.a += a
        group.d += d
        group.total += a + d
      })
      return groups
    },

    summary: function (opts = {}) {
      opts = defaults(opts, {})

      const files = getFiles()

      const dates = groupByDate(flatten(files))
      const count = props.authors.length

      const groups = keys(dates)
        .map(i => {
          const zip = zipObject(
            ['date', 'total', ...props.authors],
            [i, 0, ...new Array(count).fill(0)])

          const authors = groupBy(dates[i], 'author')
          keys(authors).forEach(j => {
            const sum = sumBy(authors[j], 'a')
            zip[j] = sum
            zip['total'] += sum
          })
          return zip
        })
      return groups.sort((a, b) => moment(a.date) - moment(b.date))
    }
  }, EventEmitter.prototype)
}

export default (target) => repository.call(target || {})

// if (!moment.isMoment(date)) date = moment(date, 'YYYY-MM-DD')

// const files = db.use('files').get(file => {
//   const changes = filter(file.changes, (o) => {
//     return date.isSameOrAfter(o.date)
//   })

//   const [a, d] = reduce(changes, (prev, curr) =>
//     [prev[0] + curr.a, prev[1] + curr.d], [0, 0])

//   file.size = a - d
//   file.a = a
//   file.d = d
//   file.changes = changes

//   if (changes.length) {
//     file.author = changes[changes.length - 1].author
//   }

//   return file
// })

// return files
//   .filter(file => !has(file, 'deletedOn') && file.size)
//   .concat({name: 'root', parent: ''})

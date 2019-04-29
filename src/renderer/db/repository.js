import assignIn from 'lodash.assignin'
import {basename} from 'path'
import database from './db'
import {EventEmitter} from 'events'
import flatten from 'lodash.flatten'
import filter from 'lodash.filter'
import groupBy from 'lodash.groupby'
import groupByDate from './util/group-by-date'
import Git from './git'
import keys from 'lodash.keys'
import moment from 'moment'
import range from './util/date-range'
import segments from './util/segments'
import sumBy from 'lodash.sumby'
import unionBy from 'lodash.unionby'
import uniq from 'lodash.uniq'
import values from 'lodash.values'

const repository = function () {
  const props = {
    cwd: this.cwd || process.cwd()
  }

  const git = Git({
    cwd: props.cwd
  })

  const [start, finish] = git.timespan.map(date => moment(date))
  let date = start.clone()

  props.authors = git.getAuthorList()
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

  const log = git.log({
    after: infoDate.subtract(1, 'd').format('YYYY-MM-DD')
  })

  log.on('data', commits => {
    commits = JSON.parse(commits.toString())

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
  log.on('finish', _ => {
    props.ready = true
    this.emit('ready')
  })

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
      isLeaf: isFile,
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
        parent: file.parent,
        isLeaf: file.isLeaf
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

    summary: function (unit) {
      unit = moment.normalizeUnits(unit)

      const files = filter(getFiles(), file => file.isLeaf)
      const dates = groupByDate(flatten(files))

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
    }
  }, EventEmitter.prototype)
}

export default (target) => repository.call(target || {})

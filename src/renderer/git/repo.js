import {basename} from 'path'
import {chdir, cwd} from 'process'
import cloneDeep from 'lodash.clonedeep'
import git from './git'
import isEmpty from 'lodash.isempty'
import isFunction from '../util/is-function'
import moment from 'moment'
import Tree from './tree'

class Repo {
  constructor (where) {
    this.after = ''
    this.base = basename(where).trim()
    this.before = ''
    this.bound = false
    this.dates = []
    this.end = ''
    this.loaded = false
    this.snaps = {}
    this.start = ''
    this.tree = new Tree()
    this.update = () => {}
    this.where = where

    this.format = {
      author: '%an',
      date: '%ad',
      message: '%s'
    }
  }

  get active () {
    return cwd() === this.path
  }

  get done () {
    return this.loaded
  }

  get name () {
    return this.base
  }

  get path () {
    return this.where
  }

  get progress () {
    const values = Object.values(this.snaps)
    const count = values.filter((x) => !!x).length
    return Math.floor((count / values.length) * 100)
  }

  get timespan () {
    if (!this.valid) return

    if (this.start && this.end) {
      return [this.start, this.end]
    }

    return [git.from, git.to]
  }

  getEndDate () {
    return this.end ? moment(this.end).toDate() : ''
  }

  getStartDate () {
    return this.start ? moment(this.start).toDate() : ''
  }

  at (date) {
    // Get the repo at the specified date.
  }

  bind () {
    try {
      chdir(this.path)
      this.bound = true
    } catch (error) {
      console.error(error)
    }

    const [start, end] = this.timespan
    this.end = end
    this.start = start
  }

  postStep = () => {
    if (!this.snaps[this.after]) {
      this.dates = this.dates.filter(date => this.after)
      delete this.snaps[this.after]
    }

    if (this.end === this.before) {
      this.loaded = true

      if (!this.snaps[this.before]) {
        this.dates = this.dates.filter(date => this.before)
        delete this.snaps[this.before]
      }
    }
  }

  handle = (chunk) => {
    const commits = JSON.parse(chunk.toString())

    for (let i = 0; i < commits.length; ++i) {
      const commit = commits[i]

      this.tree.update(commit)

      if (!this.snaps[this.after]) {
        this.snaps[this.after] = cloneDeep(this.tree)
      }
    }
  }

  init () {
    if (!this.valid) return

    let [from, to] = this.timespan

    this.snaps[from] = null
    from = moment(from, 'YYYY-MM-DD')

    this.snaps[to] = null
    to = moment(to, 'YYYY-MM-DD')

    from.add(1, 'month')

    while (from.isBefore(to)) {
      this.snaps[from.format('YYYY-MM-01')] = null
      from.add(1, 'month')
    }

    this.dates = Object.keys(this.snaps)
      .map((d) => moment(d, 'YYYY-MM-DD'))
      .sort((a, b) => a - b)
      .map((d) => d.format('YYYY-MM-DD'))
  }

  next () {
    if (!this.valid || this.loaded) return

    if (isEmpty(this.snaps)) this.init()

    this.after = this.before || this.dates[0]
    let i = this.dates.indexOf(this.after) + 1
    this.before = this.dates[i]

    const log = git.log({
      format: this.format,
      after: this.after,
      before: this.before
    })

    log.on('data', this.handle)
    log.on('finish', this.postStep)
    log.on('finish', this.update)
  }

  on (event, callback) {
    if (!isFunction(callback)) return

    if (event === 'update') {
      this.update = callback
    }
  }

  recent () {
    return this.snaps[this.after]
  }

  valid () {
    if (!this.active) {
      this.bound = false
    }
    return this.active
  }
}

export default Repo

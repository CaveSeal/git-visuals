import {basename} from 'path'
import git from './git'
import History from './history'
import isEmpty from 'lodash.isempty'
import mergeWith from 'lodash.mergewith'
import moment from 'moment'

class Repository {
  constructor (path) {
    this.name = basename(path)
    this.path = path
    this.history = new History(this.name)

    this.done = false
    this.loading = false

    this.load()
  }

  getStartDate () {
    // Cache value.
    return moment(git.getDateOfFirst())
  }

  getFinishDate () {
    // Cache value.
    return moment(git.getDateOfLast())
  }

  interrupt () {
    this.loading = false
  }

  load () {
    if (this.loading || this.done) return

    this.loading = true
    git.chdir(this.path)

    let after = this.history.last()
    if (after) {
      after = moment(after.date).add(1, 'd').format('YYYY-MM-DD')
    }

    const log = git.log({after: after})

    log.on('data', data => {
      // TODO: Ensure it finishes all commits for date.
      if (!this.loading) return

      data = JSON.parse(data.toString())
      for (let i = 0; i < data.length; ++i) {
        this.history.write(data[i])
      }
    })

    log.on('finish', _ => {
      this.done = true
      this.loading = false
    })
  }

  query (until, opts = {}) {
    let from = this.getStartDate()
    let state = opts.state || {}

    if (!isEmpty(state)) {
      from = moment(state.date)
      from.add(1, 'd')
    }

    const trees = this.history.get(
      from.format('YYYY-MM-DD'),
      until.format('YYYY-MM-DD'))

    return mergeWith({}, state, ...trees,
      (dest, src) => {
        if (!isNaN(dest)) {
          return dest + src
        }
      })
  }
}

export default Repository

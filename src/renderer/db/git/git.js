import assignIn from 'lodash.assignin'
import defaults from 'lodash.defaults'
import {EventEmitter} from 'events'
import flatten from '../util/flatten'
import keys from 'lodash.keys'
import LogTransform from './log-transform'
import mapKeys from 'lodash.mapkeys'
import mapValues from 'lodash.mapvalues'
import pickBy from 'lodash.pickby'
import {spawn, spawnSync} from 'child_process'
import uniq from 'lodash.uniq'
import values from 'lodash.values'

const options = {
  date: {
    short: true
  },
  numstat: true,
  pretty: {
    format: {
      author: '%an',
      date: '%ad',
      hash: '%h',
      message: '%s',
      sep: '@@@'
    }
  },
  reverse: true,
  summary: true
}

const git = function () {
  const props = {
    cwd: this.cwd || process.cwd(),
    env: this.env || process.env
  }

  return assignIn(this, {
    /**
     * Read and parse a git log.
     */
    log (opts = {}) {
      opts = defaults(opts, options)

      let args = mapValues(flatten(opts), (value, key) =>
        (key.substring(key.lastIndexOf('.') + 1) + '=' + value))

      const format = values(pickBy(args, (_, key) =>
        key.includes('pretty.format')))
        .map(value => value.replace('sep=', ''))
        .sort((a, _) => a.localeCompare(opts.pretty.format.sep))

      args = keys(mapKeys(args, (value, key) =>
        '--' + key.replace(/\./, '=').replace(/\..+/, ':')))

      args = args.map(arg => {
        if (arg.includes('--pretty=format:')) {
          arg = arg + format.join('__')
        }
        const date = arg.match(/(after|since|before|until)/)
        return date ? arg + '=' + opts[date[0]] : arg
      })

      args.unshift('log')

      let stream = spawn('git', args, {
        cwd: props.cwd, env: props.env
      })

      stream = stream.stdout.pipe(new LogTransform())

      stream.on('data', (data) =>
        this.emit('logData', JSON.parse(data.toString())))

      stream.on('finish', _ => this.emit('logDone'))
    },

    getAuthorInfo () {
      // 'shortlog' hangs on stdin
      const args = ['log', '--pretty=format:%an']
      return uniq(this.sync(args).split('\n'))
    },

    get duration () {
      const regex = /\d{4}([.\-/ ])\d{2}\1\d{2}/

      let args = ['HEAD', '--pretty=format:%ai']
      args.unshift('rev-list', '--max-parents=0')
      const start = this.sync(args).match(regex)[0]

      args = args.slice(-2)
      args.unshift('show', '--no-patch')
      const end = this.sync(args).match(regex)[0]

      return [start, end]
    },

    sync (args, opts = {}) {
      opts = defaults(opts, {
        cwd: props.cwd,
        env: props.env
      })
      const stream = spawnSync('git', args, opts)

      return stream.stdout.toString()
    }
  }, EventEmitter.prototype)
}

export default (target) => git.call(target)

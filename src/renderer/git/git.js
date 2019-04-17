import assign from 'lodash.assign'
import LogTransform from './log-transform'
import {spawn, spawnSync} from 'child_process'

class Git {
  constructor (opts = {}) {
    this.cwd = opts.cwd
  }

  chdir (path) {
    this.cwd = path
  }

  log (opts = {}) {
    opts = assign({
      args: [
        '--summary',
        '--numstat',
        '--date=short',
        '--reverse'
      ],
      format: {
        author: '%an',
        date: '%ad',
        hash: '%h',
        message: '%s'
      },
      separator: '@@@'
    }, opts)

    const args = ['log', ...opts.args]

    const format = Object.values(opts.format).join('--')

    if (opts.after) {
      args.push(`--after=${opts.after}`)
    }

    if (opts.before) {
      args.push(`--after=${opts.before}`)
    }

    args.push(`--pretty=format:${opts.separator}${format}`)

    const log = new LogTransform({
      fields: Object.keys(opts.format)
    })
    return this.spawn(args).pipe(log)
  }

  /**
   * Get the date of the first ever commit.
   */
  getDateOfFirst () {
    const regex = /\d{4}([.\-/ ])\d{2}\1\d{2}/
    const args = [
      'rev-list',
      '--max-parents=0',
      'HEAD',
      '--pretty=format:%ai'
    ]
    return this.spawnString(args).match(regex)[0]
  }

  /**
   * Get the date of the current last commit.
   */
  getDateOfLast () {
    const regex = /\d{4}([.\-/ ])\d{2}\1\d{2}/
    const args = [
      'show',
      'HEAD',
      '--pretty=format:%ai',
      '--no-patch'
    ]
    return this.spawnString(args).match(regex)[0]
  }

  spawn (args) {
    const stream = spawn('git', args, {
      cwd: this.cwd,
      env: process.env
    })

    // Error handling...

    return stream.stdout
  }

  spawnString (args) {
    const stream = spawnSync('git', args, {
      cwd: this.cwd,
      env: process.env
    })

    // Error handling...

    return stream.stdout.toString()
  }
}

export default new Git()

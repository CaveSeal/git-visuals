import assign from 'lodash.assign'
import {basename} from 'path'
import Log from './log'
import {spawn, spawnSync} from 'child_process'

class Git {
  log (opts = {}) {
    let after, args, before, command, fields, format, pretty

    opts = assign({
      format: {
        hash: '%h',
        date: '%ad',
        author: '%an'
      }
    }, opts)

    fields = Object.keys(opts.format)
    command = 'git'
    format = fields.map((key) => opts.format[key]).join('--')
    args = ['log', '--summary', '--numstat', '--date=short', '--reverse']

    pretty = '--pretty=format:' + '@@@' + format
    args.push(pretty)

    if (opts.after) {
      after = '--after=' + opts.after
      args.push(after)
    }

    if (opts.before) {
      before = '--before=' + opts.before
      args.push(before)
    }

    const child = spawn(command, args)

    return child.stdout.pipe(new Log(fields))
  }

  // TODO: Cache value.
  get from () {
    const regex = /\d{4}([.\-/ ])\d{2}\1\d{2}/
    const args = ['rev-list', '--max-parents=0', 'HEAD', '--pretty=format:%ai']
    const stream = spawnSync('git', args).stdout
    const [date] = stream.toString().match(regex)

    return date
  }

  // TODO: Cache value.
  get to () {
    const regex = /\d{4}([.\-/ ])\d{2}\1\d{2}/
    const args = ['show', 'HEAD', '--pretty=format:%ai', '--no-patch']
    const stream = spawnSync('git', args).stdout
    const [date] = stream.toString().match(regex)

    return date
  }

  get name () {
    const args = ['rev-parse', '--show-toplevel']
    const stream = spawnSync('git', args).stdout

    return basename(stream.toString().trim())
  }
}

export default new Git()

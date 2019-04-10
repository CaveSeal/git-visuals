import assign from 'lodash.assign'
import Log from './log'
import {spawn, spawnSync} from 'child_process'

class Git {
  log (opts = {}) {
    let args, command, fields, format, pretty

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
    args = ['log', '--numstat', '--date=short', '--reverse', '--before=2007-12-01']

    pretty = '--pretty=format:' + '@@@' + format
    args.push(pretty)

    const child = spawn(command, args)

    return child.stdout.pipe(new Log(fields))
  }

  duration () {
    let args, child, command
    const date = /\d{4}([.\-/ ])\d{2}\1\d{2}/
    let result = {}

    command = 'git'
    args = ['show', 'HEAD', '--pretty=format:%ai', '--no-patch']
    child = spawnSync(command, args)
    result.end = child.stdout.toString().match(date)[0]

    args = ['rev-list', '--max-parents=0', 'HEAD', '--pretty=format:%ai']
    child = spawnSync(command, args)
    result.start = child.stdout.toString().match(date)[0]

    return result
  }
}

export default new Git()

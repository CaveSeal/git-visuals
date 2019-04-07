import assign from 'lodash.assign'
import Log from './log'
import {spawn} from 'child_process'

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
    args = ['log', '--numstat', '--date=short', '--reverse']

    pretty = '--pretty=format:' + '@@@' + format
    args.push(pretty)

    const child = spawn(command, args)
    const log = new Log(fields)

    child.stdout.pipe(log)

    return log
  }
}

export default new Git()

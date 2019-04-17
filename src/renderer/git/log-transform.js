import compact from 'lodash.compact'
import extract from '../util/extract'
import {Transform} from 'stream'

class LogTransform extends Transform {
  constructor (opts = {}) {
    super({...opts, objectMode: true})

    this.fields = opts.fields || []
    this.modes = '(change|create|delete|rename)'
    this.saved = []
    this.sep = opts.sep || '@@@'
  }

  /**
   * Release the saved commits before finishing.
   */
  _flush (callback) {
    let data = this.parse(this.saved)
    if (data.length) {
      this.push(Buffer.from(JSON.stringify(data)))
    }
    callback()
  }

  _transform (chunk, _, callback) {
    chunk = chunk.toString()

    let data = chunk.split('@@@')
    data = compact(data).map(x => x.replace(/\n\r|\r/g, '\n'))

    const fresh = /^\s*@@@/.test(chunk)

    if (!fresh && this.saved.length) {
      this.saved.push(this.saved.pop() + data.shift())
    }

    if (data.length) {
      const save = data.pop()
      data = [this.saved.pop(), ...data]
      this.saved.push(save)
      data = this.parse(data)
      this.push(Buffer.from(JSON.stringify(data)))
    }
    callback()
  }

  /**
   * Parse an array of commit strings into objects.
   */
  parse (data = []) {
    data = compact(data).filter(x => x !== '\n')

    let commits = data
      .map(chunk => {
        chunk = chunk.trim().split('\n')

        const commit = {}
        let info = chunk.shift().split('--')

        for (let i = 0; i < info.length; ++i) {
          commit[this.fields[i]] = info[i]
        }

        let check = /^([0-9]|-)/
        let files = chunk.filter(x => check.test(x))
        let modes = chunk.filter(x => !check.test(x))

        files = files.map((x) =>
          x.replace(/\s+=>\s+/g, '=>').replace(/\s+/g, ' ').trim().split(' '))

        files = files.map((line) => {
          let [a, d, file] = line

          const mode = modes.find((mode) => mode.includes(file))

          let before = null
          if (file.includes('=>')) {
            const match = extract(file, /{([^}]+)}/g)[0]

            const [left, right] = (match || file)
              .split('=>')
              .map((side) => (match ? file.replace(/{([^}]+)}/g, side) : side))
            file = right
            before = left
          }

          const change = {
            a: a === '-' ? 0 : +a,
            d: d === '-' ? 0 : +d,
            name: file,
            was: before,
            mode: mode ? mode.match(new RegExp(this.modes))[0] : null
          }

          return change
        })
        commit.files = files

        return commit
      })

    return commits
  }
}

export default LogTransform

import compact from 'lodash.compact'
import extract from '../util/extract'
import {Transform} from 'stream'

class LogTransform extends Transform {
  saved = []

  _flush (cb) {
    let data = this.parse(this.saved)
    if (data.length) {
      this.push(Buffer.from(JSON.stringify(data)))
    }
    cb()
  }

  _transform (chunk, _, cb) {
    chunk = chunk.toString()

    let data = chunk.split('@@@__')
    data = compact(data).map(x => x.replace(/\n\r|\r/g, '\n'))

    const fresh = /^\s*@@@__/.test(chunk)

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
    cb()
  }

  parse (data = []) {
    data = compact(data).filter(x => x !== '\n')

    let commits = data
      .map(chunk => {
        chunk = chunk.trim().split('\n')

        const commit = {}
        let info = chunk.shift().split('__')

        for (let i = 0; i < info.length; ++i) {
          const [key, value] = info[i].split('=')
          commit[key] = value
        }

        let check = /^([0-9]|-)/
        let files = chunk.filter(x => check.test(x))
        let modes = chunk.filter(x => !check.test(x))

        files = files.map((x) =>
          x.replace(/\s+=>\s+/g, '=>').replace(/\s+/g, ' ').trim().split(' '))

        files = files.map((line) => {
          let [a, d, file] = line

          let was = null
          if (file.includes('=>')) {
            const match = extract(file, /{([^}]+)}/g)[0]

            const [left, right] = (match || file)
              .split('=>')
              .map((side) =>
                (match ? file.replace(/{([^}]+)}/g, side) : side))
            was = left
            file = right
          }

          const mode = modes.find((mode) => mode.includes(file))

          const change = {
            a: a === '-' ? 0 : +a,
            d: d === '-' ? 0 : +d,
            name: file
          }

          if (was) change.was = was

          if (mode) {
            change.mode = mode.match(new RegExp(/(change|create|delete|rename)/))[0]
          }

          if (a === '-') change.binary = true

          return change
        })
        commit.files = files

        return commit
      })

    return commits
  }
}

export default LogTransform

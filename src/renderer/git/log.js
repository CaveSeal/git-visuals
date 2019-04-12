import {Transform} from 'stream'

class Log extends Transform {
  constructor (fields, opts = {}) {
    super({...opts, objectMode: true})

    this.fields = fields
    this.saved = []
  }

  _flush (next) {
    let data = this.parse(this.saved)
    if (data.length) {
      this.push(Buffer.from(JSON.stringify(data)))
    }
    next()
  }

  _transform (chunk, encoding, next) {
    chunk = chunk.toString()

    let data = chunk.split('@@@')
    data = data.filter((value) => !!value)

    if (!(/^\s*@@@/.test(chunk))) {
      if (this.saved.length) {
        let prev = this.saved.pop()
        this.saved.push(prev + data.shift())
      }
    }

    if (data.length) {
      const save = data.pop()
      data = [this.saved.pop(), ...data]
      this.saved.push(save)
    }

    data = this.parse(data)

    if (data.length) {
      this.push(Buffer.from(JSON.stringify(data)))
    }
    next()
  }

  parse (data) {
    const regex = /(change|create|delete)/g

    return data
      .filter((value) => !!value && value.length > 1)
      .map((value) => {
        value = value.trim().split('\n')

        let fields = value.shift().split('--')

        let changes = value.filter(x => /^([0-9]|-)/.test(x))
        let modes = value.filter(x => !(/^([0-9]|-)/.test(x)))

        const commit = {}

        fields.forEach((field, i) => {
          commit[this.fields[i]] = field
        })

        changes = changes
          .map((line) => line.replace(/\s+=>\s+/g, '=>')
            .replace(/\s+/g, ' ').trim().split(' '))

        // Parse file changes
        changes = changes
          .map((line) => {
            const mode = modes.find((m) => m.includes(line[2]))

            const change = {
              a: line[0] === '-' ? 0 : +line[0],
              d: line[1] === '-' ? 0 : +line[1],
              file: line[2],
              mode: mode ? mode.match(regex)[0] : null
            }
            regex.lastIndex = 0

            return change
          })
        commit.changes = changes

        return commit
      })
  }
}

export default Log

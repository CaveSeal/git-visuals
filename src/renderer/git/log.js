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

  /**
   * Convert an array of strings into commit objects
   *
   * @param commits An array of commits of type string
   */
  parse (commits) {
    const modeRegex = /(change|create|delete|rename)/g

    commits = commits.filter((commit) => !!commit && commit.length > 1)

    return commits.map((commit) => {
      const data = {}

      commit = commit.trim().split('\n')

      let info = commit.shift().split('--')

      for (let i = 0; i < info.length; ++i) {
        data[this.fields[i]] = info[i]
      }

      let regex = /^([0-9]|-)/
      let changes = commit.filter((line) => regex.test(line))
      let modes = commit.filter((line) => !(regex.test(line)))

      changes = changes.map((x) =>
        x.replace(/\s+=>\s+/g, '=>').replace(/\s+/g, ' ').trim().split(' '))

      changes = changes.map((line) => {
        const mode = modes.find((mode) => mode.includes(line[2]))

        const change = {
          a: line[0] === '-' ? 0 : +line[0],
          d: line[1] === '-' ? 0 : +line[1],
          file: line[2],
          mode: mode ? mode.match(modeRegex)[0] : null
        }
        regex.lastIndex = 0

        return change
      })
      data.changes = changes

      return data
    })
  }
}

export default Log

import {Transform} from 'stream'

class Log extends Transform {
  constructor (fields, opts = {}) {
    super({...opts, objectMode: true})

    this.fields = fields
    this.saved = []
  }

  _transform (chunk, encoding, next) {
    chunk = chunk.toString()

    let data = chunk.split('@@@')

    if (!(/^\s*@@@/.test(chunk))) {
      if (this.saved.length) {
        let prev = this.saved.pop()
        this.saved.push(prev + data.shift())
      }
    }

    data = data.filter((v) => !!v && (v.length - 1))
    if (data.length) {
      this.saved.push(data.pop())
    }

    data = this.saved.slice(0, -1).concat(data)

    data = data.map((commit) => {
      commit = commit.trim().split('\n')
      const obj = {}
      let fields = commit.shift().split('--')

      fields.forEach((field, i) => {
        obj[this.fields[i]] = field
      })

      commit = commit
        .map((line) => line
          .replace(/\s+=>\s+/g, '=>')
          .replace(/\s+/g, ' ').trim().split(' '))
        .map((line) => ({
          a: line[0] === '-' ? 0 : +line[0],
          d: line[1] === '-' ? 0 : +line[1],
          file: line[2]
        }))
      obj.changes = commit

      return obj
    })

    if (data.length) {
      this.push(Buffer.from(JSON.stringify(data)))
    }
    next()
  }
}

export default Log

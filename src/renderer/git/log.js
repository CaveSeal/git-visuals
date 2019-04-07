import {Transform} from 'stream'

class Log extends Transform {
  constructor (fields, opts = {}) {
    super({...opts, objectMode: true})

    this.commits = []
    this.fields = fields
  }

  _transform (chunk, encoding, next) {
    chunk = chunk.toString()

    this.push(Buffer.from(JSON.stringify(chunk)))
    next()
  }
}

export default Log

// chunk = chunk.toString()

//     if (chunk.trim().startsWith('@@@')) {
//       let data = chunk.split('@@@')

//       // Remove empty strings.
//       data = data.filter((d) => d !== '')

//       if (this.commits.length !== 0) {
//         chunk = this.commits

//         chunk = chunk.map((commit) => {
//           commit = commit.trim().split('\n')

//           const obj = {}

//           let fields = commit.shift()
//           fields = fields.split('--')
//           fields.forEach((field, i) => { obj[this.fields[i]] = field })

//           commit = commit
//             .map((line) => line.replace(/\s=>\s/g, '=>'))
//             .map((line) => line.replace(/\s+/g, ' ').trim().split(' '))
//             .map((line) => ({
//               a: line[0] === '-' ? '0' : line[0],
//               d: line[1] === '-' ? '0' : line[1],
//               file: line[2]
//             }))

//           obj.changes = [...commit]

//           return obj
//         })

//         chunk = chunk.filter(v => v.hash !== '')
//         this.push(Buffer.from(JSON.stringify(chunk)))

//         this.commits.length = 0
//       }
//       this.commits = this.commits.concat(data)
//     } else {
//       if (!(/^\d+\s\d+\s.+$/g.test(chunk))) {
//         let data = chunk.split('@@@')
//         this.commits[this.commits.length - 1] += data.shift()
//         this.commits = this.commits.concat(data)
//       }
//     }
//     next()

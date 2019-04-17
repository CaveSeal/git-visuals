import cbor from 'cbor'
import FileSync from 'lowdb/adapters/FileSync'
import isPlainObject from 'lodash.isplainobject'
import low from 'lowdb'
import moment from 'moment'
import tree from './tree'

class History {
  constructor (filename) {
    const file = filename + '.json'

    // const adapter = new FileSync(file, {
    //   serialize: this.encode,
    //   deserialize: this.decode
    // })
    const adapter = new FileSync(file)
    this.db = low(adapter)

    this.db.defaults({commits: []}).write()
  }

  write (commit) {
    this.db
      .get('commits')
      .push(tree.from(commit))
      .write()
  }

  get (after, before) {
    return this.db
      .get('commits')
      .filter(commit =>
        moment(commit.date).isSameOrAfter(after) &&
        moment(commit.date).isSameOrBefore(before))
      .cloneDeepWith(this._customiser)
      .value()
  }

  last () {
    return this.db
      .get('commits')
      .sort((a, b) => moment(a.date) - moment(b.date))
      .last()
      .value()
  }

  encode = (data) => cbor.encode(JSON.stringify(data))

  decode = (data) => JSON.parse(cbor.decodeFirst(data))

  _customiser = (value, _, object) => {
    if (!isPlainObject(value) ||
      value.hasOwnProperty('root')) return
    value.author = object.author
    value.hash = object.hash
    value.message = object.message
    value.date = object.date
  }
}

export default History

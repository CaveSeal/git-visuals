import assignIn from 'lodash.assignin'
import low from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'
import isFunction from 'lodash.isfunction'

const db = function () {
  const lowdb = low(new FileSync(`${this.name}.json`))

  const props = {
    select: null,
    get key () {
      return this.select.key
    },
    get table () {
      return this.select.table
    },
    tables: {}
  }

  return assignIn(this, {
    init: (function () {
      lowdb.defaults({}).write()
    }()),

    table: function (name, opts = {}) {
      if (!lowdb.has(name).value()) {
        lowdb.set(name, opts.isObject ? {} : []).write()
      }

      props.tables[name] = {
        table: name,
        key: opts.key || 'id'
      }
    },

    count: function () {
      return lowdb.get(props.table).size().value()
    },

    push: function (item) {
      if (this._find(item).value()) return
      lowdb.get(props.table).push(item).write()
    },

    get: function (mapFn) {
      let table = lowdb.get(props.table).cloneDeep()

      if (mapFn || isFunction(mapFn)) {
        table = table.map(mapFn)
      }
      return table.value()
    },

    getAll: function (key) {
      let table = lowdb.get(props.table)
      if (key) {
        table = table.map(key)
      }
      return table.value()
    },

    has: function (key) {
      return lowdb.get(props.table).has(key).value()
    },

    set: function (key, value) {
      const table = lowdb.get(props.table)

      table.set(key, value).write()
    },

    mergeUpdate: function (item, fn) {
      let found = this._find(item)

      if (found.value()) {
        found = !(fn || isFunction(fn))
          ? found.assignIn(item)
          : found.mergeWith(item, fn)
        found.write()
      } else {
        this.push(item)
      }
    },

    update: function (key, fn) {
      const table = lowdb.get(props.table)

      table.update(key, fn).write()
    },

    use: function (table) {
      props.select = props.tables[table]
      return this
    },

    _find: function (item) {
      const temp = {}
      temp[props.key] = item[props.key]

      return lowdb.get(props.table).find(temp)
    }
  })
}

export default (target) => db.call(target)

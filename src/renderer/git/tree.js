import between from '../util/between'
import get from 'lodash.get'
import isEmpty from 'lodash.isempty'
import unset from 'lodash.unset'
import update from 'lodash.update'

/**
 * A project heirarchy.
 */
class Tree {
  constructor () {
    this.children = {}
  }

  update (commit) {
    const curly = /{([^}]+)}/g
    const snip = this.children

    const locked = []
    const unused = []
    const empty = ['']

    // TODO: Think of a cleaner way.
    commit.changes.forEach((change) => {
      let path = change.file
      if (path.includes('=>')) {
        const matches = between(path, curly)
        curly.lastIndex = 0

        let parts = []
        if (!matches[0]) {
          parts = matches[0].split('=>')
            .map((side) => path
              .replace(curly, side).split('/'))
        } else {
          parts = path.split('=>')
            .map((side) => side.split('/'))
        }
        const [left, right] = parts

        const size = get(snip, left.concat('size'))

        empty.concat(left).reduce((prev, curr, i, arr) => {
          update(snip, prev.concat([curr, 'size']), (n) => n - size)

          const child = get(snip, prev.concat(curr), {size: 0})
          if (child.size === 0 || i === arr.length) {
            unused.push(prev.concat(curr).join('/'))
          }
          return prev.concat(curr)
        })

        empty.concat(right).reduce((prev, curr) => {
          update(snip, prev.concat([curr, 'size']), (n) => (n || 0) + size)
          update(snip, prev.concat([curr, 'fresh'], (n) => true))

          return prev.concat(curr)
        })

        path = right.join('/')
      }

      empty.concat(path.split('/')).reduce((prev, curr, i, arr) => {
        let child = get(snip, prev.concat(curr)) || { fresh: true, size: 0 }

        const treepath = prev.concat(curr).join('/')

        if (child.fresh) locked.push(treepath)

        child.size += (+change.a) - (+change.d)

        if (!child.fresh && !child.size && !locked.includes(treepath)) {
          unused.push(prev.concat(curr).join('/'))
        } else {
          update(snip, prev.concat(curr), (n) => child)
        }
        child.fresh = isEmpty(child)
        return prev.concat(curr)
      })
    })
    unused.forEach((path) => unset(snip, path.split('/')))
  }
}

export default new Tree()

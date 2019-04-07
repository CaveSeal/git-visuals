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
    const snip = this.children
    const curly = /{([^}]+)}/g

    const locked = []
    const remove = []

    commit.changes.forEach((change) => {
      let file = change.file

      if (file.includes('=>')) {
        const matches = between(file, curly)

        curly.lastIndex = 0

        let sides = (matches[0] ? matches[0] : file)
        sides = sides.split('=>')
        if (matches[0]) {
          sides = sides.map((side) => file.replace(curly, side))
        }
        sides = sides.map((side) => side.split('/'))

        const [left, right] = sides
        const x = get(snip, [...left, 'size'], 0)

        left.reduce((path, seg, index, arr) => {
          const next = [...path.split('/'), seg]
          update(snip, [...next, 'size'], (n) => n - x)

          const node = get(snip, next, {size: 0})
          if (node.size === 0 || index === arr.length) {
            remove.push(next.join('/'))
          }
          return next.join('/')
        })

        right.reduce((path, seg) => {
          const next = [...path.split('/'), seg]
          update(snip, [...next, 'size'], (n) => (n || 0) + x)
          update(snip, [...next, 'keep'], (n) => true)
          return next.join('/')
        })
        file = right.join('/')
      }

      file = file.split('/')
      file.reduce((path, seg, index, arr) => {
        const next = [...path.split('/'), seg]

        let node = get(snip, next)
        node = node || { keep: true, size: 0 }

        if (node.keep) locked.push(next.join('/'))

        node.size += (+change.a) - (+change.d)

        const isLocked = locked.includes(next.join('/'))

        if (!node.keep && !node.size && !isLocked) {
          remove.push(next.join('/'))
        } else {
          update(snip, next, (n) => node)
        }
        node.keep = isEmpty(node)

        return next.join('/')
      })
    })
    remove.forEach((path) => unset(snip, path.split('/')))
  }
}

export default new Tree()

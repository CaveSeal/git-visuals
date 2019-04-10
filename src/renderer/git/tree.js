import assign from 'lodash.assign'
import between from '../util/between'
import get from 'lodash.get'
import isEmpty from 'lodash.isempty'
import traverse from '../util/traverse'
import uniqueId from 'lodash.uniqueid'
import unset from 'lodash.unset'
import update from 'lodash.update'

/**
 * A project heirarchy.
 */
class Tree {
  constructor () {
    this.children = {}
    this.depth = 0
    this.graph = {}
  }

  update (commit) {
    const snip = this.children
    const curly = /{([^}]+)}/g

    const locked = []
    const remove = []
    const empty = ['']

    commit.changes.forEach((change) => {
      let file = change.file
      let size
      let isDirty = false

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
        size = get(snip, [...left, 'size'], 0)

        empty.concat(left).reduce((path, seg, index, arr) => {
          const next = [...path.split('/'), seg]
          update(snip, [...next, 'size'], (n) => n - size)

          const node = get(snip, next, {size: 0})
          if (!node.size || index === arr.length) {
            remove.push(next.join('/'))
          }
          return next.join('/')
        })

        isDirty = true
        file = right.join('/')
      }

      file = file.split('/')
      this.depth = Math.max(this.depth, file.length)

      empty.concat(file).reduce((path, seg, index, arr) => {
        let next = [...path.split('/'), seg]
        next = next.filter((value) => value !== '')

        if (isDirty) {
          update(snip, next, (n) => assign(n, {
            keep: true,
            size: (n || 0) + size
          }))
        }

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
      isDirty = false
    })
    remove.forEach((path) => unset(snip, path.split('/')))

    // Don't do this until it is necessary.
    this.graph = this.graphify()
  }

  graphify () {
    const root = {
      id: uniqueId(),
      label: 'root'
    }

    const graph = {
      links: [],
      nodes: [root]
    }

    traverse(this.children, (value, key, parent) => {
      let target = graph.nodes
        .find((node) => node.label === parent)

      target = target || root

      let node = graph.nodes
        .find((node) => node.label === key && node.id === parent)

      node = node || {
        id: uniqueId(),
        label: key,
        size: value.size,
        parent: parent
      }
      node.size = node.size || value.size
      graph.nodes.push(node)

      graph.links.push({
        source: graph.nodes[graph.nodes.length - 1].id,
        strength: 0.1,
        target: target.id
      })
    }, ['keep', 'size'])

    return graph
  }
}

export default new Tree()

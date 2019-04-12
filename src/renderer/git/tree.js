import between from '../util/between'
import get from 'lodash.get'
import traverse from '../util/traverse'
import unset from 'lodash.unset'
import update from 'lodash.update'

/**
 * A project heirarchy.
 */
class Tree {
  constructor () {
    this.children = {}
    this.graph = {}
    this.name = ''
  }

  update (commit) {
    const copy = this.children
    const regex = /{([^}]+)}/g

    for (let i = 0; i < commit.changes.length; ++i) {
      const change = commit.changes[i]

      let file = change.file
      let size = 0
      let discard = []

      if (change.file.includes('=>')) {
        const match = between(change.file, regex)[0]

        regex.lastIndex = 0

        const [left, right] = (match || file)
          .split('=>')
          .map((side) => (match ? file.replace(regex, side) : side)
            .split('/')
            .filter((x) => x !== ''))

        size = get(copy, [...left, 'size'], 0)

        left.reduce((path, seg, i, arr) => {
          path = [...path].concat([seg])

          update(copy, [...path, 'size'], (n) => n - size + 1)

          const node = get(copy, path)
          if (Object.values(node).length <= 2) {
            discard.push(path)
          } else {
            discard = discard.filter(path => path.includes(left[0]))
          }
          return path
        }, [])

        file = right
      }

      file = Array.isArray(file) ? file : file.split('/')

      file.reduce((path, seg, i, arr) => {
        path = path.concat(seg)

        let node = get(copy, path)
        node = node || {size: 0}
        node.size += (+change.a) - (+change.d) + size

        if (change.mode === 'delete') {
          if (Object.values(node).length <= 2) {
            discard.push(path)
          } else {
            discard = discard.filter(path => path.includes(file[0]))
          }
        }

        if (node.size > 0) {
          update(copy, path, (n) => node)
        } else {
          discard.push(path)
        }

        return path
      }, [])
      discard.forEach((path) => unset(copy, path))
    }
  }

  get root () {
    const layout = {
      name: this.name,
      children: []
    }

    traverse(this.children, (value, key, path) => {
      let children = layout.children
      path.forEach((seg) => {
        let child = children.find((e) => e.name === seg)
        if (!child) {
          child = {
            name: seg,
            size: value,
            children: []
          }
          children.push(child)
        }
        children = child.children
      })
    }, { ignore: ['keep'] })

    return layout
  }
}

export default new Tree()

import between from '../util/between'
import get from 'lodash.get'
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
    this.repository = ''
  }

  clear () {
    this.children = {}
    this.repository = ''
  }

  get root () {
    const layout = {
      children: [],
      id: uniqueId(),
      name: this.repository
    }

    traverse(this.children, (value, key, path) => {
      let children = layout.children

      for (let i = 0; i < path.length; ++i) {
        let node = children
          .find((d) => path[i] === d.name)

        if (!node) {
          node = {
            name: path[i],
            children: []
          }
          children.push(node)
        }

        if (key.includes('id')) {
          node.id = value
        }
        if (key.includes('author')) {
          node.author = value
        }
        if (key.includes('size')) {
          node.size = value
        }

        children = node.children
      }
    }, {ignore: ['keep']})

    return layout
  }

  /**
   * @param {any} value
   */
  set name (value) {
    this.repository = value
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

          update(copy, [...path, 'size'], (n) => n - size)
          update(copy, [...path, 'author'], (n) => commit.author)

          if (Object.values(get(copy, path)).length <= 4) {
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
        node = node || {size: 0, id: uniqueId()}
        node.size += (+change.a) - (+change.d) + size
        node.author = commit.author

        if (change.mode === 'delete') {
          if (Object.values(node).length <= 4) {
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
}

export default Tree

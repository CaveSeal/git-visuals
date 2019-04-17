import assign from 'lodash.assign'
import traverse from '../util/traverse'
import uniqueId from 'lodash.uniqueid'
import update from 'lodash.update'

class Tree {
  /**
   * Create a tree from a commit.
   */
  from (commit) {
    const files = commit.files

    const tree = {
      author: commit.author,
      date: commit.date,
      root: {},
      hash: commit.hash,
      message: commit.message
    }

    for (let i = 0; i < files.length; ++i) {
      const file = files[i].name.split('/')

      file.reduce((path, next, j, arr) => {
        path = [...path, next]

        const a = +files[i].a
        const d = +files[i].d

        update(tree.root, path, (n) => {
          const change = {}

          change.a = n ? n.a + a : a
          change.d = n ? n.d + d : d
          if (j === arr.length) {
            change.mode = files[i].mode
            change.was = [files[i].was]
          }
          return assign(n, change)
        })

        return path
      }, [])
    }
    return tree
  }

  hierarchy (tree) {
    const layout = {
      children: []
    }

    traverse(tree.root, (value, key, path) => {
      let {children} = layout

      for (let i = 0; i < path.length; ++i) {
        let node = children
          .find((d) => path[i] === d.name)
        if (!node) {
          node = {
            id: uniqueId(),
            name: path[i],
            children: []
          }
          children.push(node)
        }

        if (key === 'author') node.author = value
        if (key === 'date') node.date = value
        if (key === 'hash') node.hash = value
        if (key === 'a') node.a = value
        if (key === 'd') node.d = value
        if (key === 'message') node.message = value

        children = node.children
      }
    })
    return layout
  }
}

export default new Tree()

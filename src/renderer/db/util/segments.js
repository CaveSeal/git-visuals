function segments (path) {
  const segs = path.split('/')

  let paths = []
  segs.reduce((path, next) => {
    path = [...path, next]
    paths.push(path.join('/'))
    return path
  }, [])
  return paths
}

export default segments

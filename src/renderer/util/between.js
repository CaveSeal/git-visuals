function between (str, regex) {
  const found = []

  if (regex instanceof RegExp) {
    let match = regex.exec(str)
    while (match) {
      found.push(match[1])
      match = regex.exec(str)
    }
  }
  return found
}

export default between

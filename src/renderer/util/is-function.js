/**
 * https://stackoverflow.com/questions/5999998/check-if-a-variable-is-of-function-type
 */
function isFunction (fn) {
  return fn && {}.toString.call(fn) === '[object Function]'
}

export default isFunction

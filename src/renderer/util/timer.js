/**
 * Accurate Javascript setInterval replacement
 * See https://gist.github.com/manast/1185904
 */
function Timer (duration, fn) {
  this.baseline = undefined

  this.run = function () {
    if (this.baseline === undefined) {
      this.baseline = new Date().getTime()
    }
    fn()
    let end = new Date().getTime()
    this.baseline += duration

    let nextTick = duration - (end - this.baseline)
    if (nextTick < 0) {
      nextTick = 0
    }
    (function (i) {
      i.timer = setTimeout(function () {
        i.run(end)
      }, nextTick)
    }(this))
  }

  this.clear = function () {
    this.baseline = undefined
  }

  this.stop = function () {
    clearTimeout(this.timer)
  }
}

export default Timer

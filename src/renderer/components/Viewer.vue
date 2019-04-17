<template>
  <div class="wrapper">
    <el-progress :show-text="false" :stroke-width="8" :percentage="progress"></el-progress>
    <div ref="main" id="main-box">
      <div ref="side" id="side-box"></div>
    </div>
  </div>
</template>

<script>
import ForceGraph from '../charts/force-graph'
// import Heatmap from '../charts/heatmap'
import Timer from '../util/timer'
import tree from '../git/tree'

export default {
  name: 'app-viewer',
  data () {
    return {
      now: null,
      progress: 0,
      state: {},
      timer: null
    }
  },
  props: {
    paused: Boolean,
    repo: Object
  },
  computed: {
    from: function () {
      if (!this.repo) return null

      return this.repo.getStartDate()
    },
    to: function () {
      if (!this.repo) return null

      return this.repo.getFinishDate()
    }
  },
  watch: {
    repo: function (next, prev) {
      this.init(next)
    },
    paused: function (value) {
      if (this.repo) {
        value ? this.stop() : this.start()
      }
    }
  },
  mounted () {
    this.chart = new ForceGraph({
      element: '#' + this.$refs.main.id,
      height: this.$refs.main.clientHeight,
      width: this.$refs.main.clientWidth
    })

    this.timer = new Timer(2000, this.loop)
  },
  methods: {
    init (repo) {
      this.stop()

      this.now = this.from.clone()
      this.now.add(1, 'y')
      this.state = {}
      this.update()

      if (!this.paused) this.start()
    },
    loop () {
      if (this.now.isSame(this.to) || this.paused) return

      this.now.add(1, 'y')
      if (this.now.isSameOrAfter(this.to)) this.now = this.to

      this.update()
    },
    start () {
      this.timer.run()
    },
    stop () {
      this.timer.stop()
      this.timer.clear()
    },
    update () {
      const opts = {state: this.state || {}}
      this.state = this.repo.query(this.now, opts)

      const data = tree.hierarchy(this.state)
      this.chart.update(data)

      const done = this.now - this.from
      const total = this.to - this.from
      this.progress = Math.round((done / total) * 100)
    }
  }
}
</script>

<style scoped>
.wrapper {
  background-color: #fff;
  border-radius: 5px;
  display: flex;
  flex: 1;
  flex-direction: column;
  position: relative;
}

.wrapper #main-box {
  flex: 1;
  position: relative;
}

.wrapper #side-box {
  border-radius: 5px;
  height: 200px;
  position: absolute;
  right: 1%;
  top: 1%;
  width: 200px;
  z-index: 1;
}
</style>

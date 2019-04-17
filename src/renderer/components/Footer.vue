<template>
  <div class="wrapper">
    <el-button size="mini" round @click="toggle">Play</el-button>
  </div>
</template>

<script>
export default {
  name: 'app-footer',
  data () {
    return {
      paused: true
    }
  },
  methods: {
    toggle ({srcElement}) {
      this.paused = !this.paused

      const text = this.paused ? 'Play' : 'Pause'
      srcElement.innerText = text

      this.$emit('paused', this.paused)
    }
  }
}
</script>

<style scoped>
.wrapper {
  background-color: #393e46;
  padding: 16px 24px;
  height: 100%;
  width: 100%;
}

.wrapper .el-button {
  background-color: #232931;
  border: none;
  color: #eee;
  width: 70px;
}

.wrapper .el-button:active,
.wrapper .el-button:hover {
  background-color: #4ecca3;
}
</style>

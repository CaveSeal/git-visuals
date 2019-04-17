<template>
  <div class="wrapper">
  <!--<div class="date-picker">
    <el-date-picker
      v-model="range"
      type="daterange"
      range-separator="To"
      start-placeholder="Start date"
      end-placeholder="End date"
      :picker-options="options">
    </el-date-picker>
  </div>-->
  </div>
</template>

<script>
export default {
  name: 'app-header',
  data () {
    return {}
  }
}
</script>

<style scoped>
.wrapper {
  background-color: #393e46;
  border-top: 1px solid #333;
  height: 100%;
  width: 100%;
}

.el-date-editor {
  width: 100%;
}

.el-date-editor, .el-date-editor .el-range-input {
  background-color: #393e46;
  border: none;
  color: #ccc;
  font-family: 'Abel', sans-serif;
}

.el-date-editor .el-range-separator {
  color: #ccc;
  width: 6%;
}
</style>

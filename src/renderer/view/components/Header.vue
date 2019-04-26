<template>
  <div class="wrapper">
    <el-select
      size="mini"
      v-model="value"
      placeholder="Select"
      @change="$emit('change', $event)">
      <el-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value">
      </el-option>
    </el-select>
  </div>
</template>

<script>
export default {
  name: 'app-header',
  data () {
    return {
      options: [
        { value: 'force', label: 'Force Graph' },
        { value: 'heatmap', label: 'Heatmap' }
      ],
      value: 'force'
    }
  }
}
</script>

<style scoped>
.wrapper {
  align-items: center;
  background-color: #393e46;
  border-top: 1px solid #333;
  display: flex;
  height: 100%;
  justify-content: flex-end;
  padding-right: 20px;
  width: 100%;
}
</style>

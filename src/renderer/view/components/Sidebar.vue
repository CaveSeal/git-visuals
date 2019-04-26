<template>
  <el-aside v-bind:width="width">
    <div class="add-path">
      <el-button circle type="primary" v-bind:icon="icon" @click="openDialog()"></el-button>
      <span>Add a project</span>
    </div>
    <div class="list-paths">
      <span>Projects</span>
      <div
        v-bind:class="{active: checkIfActive(path)}"
        v-for="path in paths"
        v-on:click="select(path)">
        {{ getName(path) }}
      </div>
    </div>
  </el-aside>
</template>

<script>
import {basename} from 'path'
import {ipcRenderer} from 'electron'

export default {
  name: 'app-sidebar',
  data () {
    return {
      icon: 'el-icon-plus',
      paths: [],
      selected: '',
      width: this.span
    }
  },
  props: {
    span: {
      default: '200px',
      type: String
    }
  },
  created () {
    ipcRenderer.on('folders', (event, path) => {
      if (path && !this.paths.includes(path[0])) {
        this.paths.push(path[0])
      }
    })
  },
  methods: {
    checkIfActive (path) {
      return path === this.selected
    },
    getName (path) {
      return basename(path)
    },
    openDialog () {
      ipcRenderer.send('openFolder', () => {
        // Send an event to ipc main.
      })
    },
    select (path) {
      this.$emit('select', path)
      this.selected = path
    }
  }
}
</script>

<style scoped>
.add-path {
  border-bottom: 1px solid #393e46;
  padding: 16px 24px;
}

.add-path span {
  margin: 0px 8px;
}

.el-aside {
  background-color: #232931;
  color: #ddd;
  font-size: 16px;
}

.el-button--primary {
  background-color: #393e46;
  border: none;
  color: #eee;
}

.el-button:active,
.el-button:hover {
  background-color: #4ecca3;
}

.list-paths {
  padding: 32px;
}

.list-paths div {
  background-color: #393e46;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 8px;
  padding: 4px 18px;
}

.list-paths div:hover,
.list-paths div.active {
  background-color: #4ecca3;
}
</style>

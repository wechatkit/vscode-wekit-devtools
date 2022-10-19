<template>
  <div class="console">
    <div class="log" v-for="log in logs" :key="log.__id">
      <div class="log-briefly" :class="[log[0]]">
        <text
          v-for="index in log.length - 1"
          class="q-pl-xs briefly-block"
          :class="{
            number: typeof log[index] === 'number',
          }"
          :key="index"
          >{{ log[index] }}
        </text>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps } from "vue";

const props = defineProps<{
  logs: any[];
}>();
</script>

<style scoped>
.console {
  /* border: 1px solid #eee;
  border-bottom: 0; */
}
.log {
  border-bottom: 1px solid #333;
  padding-left: 20px;
}
.log-briefly {
  white-space: nowrap;
  overflow: hidden;
  overflow-x: auto;
}

.log-briefly::-webkit-scrollbar {
  display: none;
}

.log-briefly.info {
  color: #fff;
}

.log-briefly.error {
  color: red;
}

.log-briefly.warn {
  color: #f60;
}

.log-briefly.log {
  color: #fff;
}

.log-briefly.line {
  background-color: #eee;
  height: 2px;
}

.briefly-block.number {
  color: #7070ff;
}
</style>

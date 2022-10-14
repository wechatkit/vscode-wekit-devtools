<template>
  <div class="console">
    <div class="split-line" v-for="log in logs" :key="log.__id">
      <text
        class="q-pl-xs log"
        :class="{
          number: typeof item === 'number',
        }"
        v-for="(item, index) in log"
        :key="index"
        >{{ item }}</text
      >
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
.split-line {
  border-bottom: 1px solid #333;
  padding-left: 20px;
}
.log.number {
  color: #7070ff;
}
</style>

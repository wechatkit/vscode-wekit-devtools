<template>
  <div class="console">
    <div class="log" v-for="log in logs" :key="log.__id">
      <div class="log-briefly" :class="[log[0]]">
        <span
          v-for="index in log.length - 1"
          class="q-pl-xs briefly-block"
          :key="index"
          v-html="logBriefly(log[index])"
        >
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps } from "vue";

const props = defineProps<{
  logs: any[];
}>();

function logBriefly(briefly: any, isObject: boolean = false): any {
  if (briefly === null || briefly === undefined) {
    return briefly;
  }
  if (typeof briefly === "string" && isObject) {
    return `<span style="color: #f60">"${briefly}"</span>`;
  }
  if (typeof briefly === "number" || typeof briefly === "boolean") {
    return `<span style="color: #7070ff">${briefly}</span>`;
  }
  if (typeof briefly === "object") {
    if (Array.isArray(briefly)) {
      return `[${briefly
        .slice(0, 5)
        .map((item) => logBriefly(item, true))
        .join(", ")}${briefly.length > 5 ? ",..." : ""}]`;
    } else {
      return `{${Object.keys(briefly)
        .slice(0, 5)
        .map((key) => `${key}: ${logBriefly(briefly[key], true)}`)
        .join(", ")}${Object.keys(briefly).length > 5 ? ",..." : ""}}`;
    }
  }
  return briefly;
}
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
</style>

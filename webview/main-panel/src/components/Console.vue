<template>
  <div class="console">
    <div class="log" v-for="(log, index) in logs" :key="log.__id">
      <div class="log-briefly" :class="[log[0]]">
        <q-icon
          :class="{ 'rotate-90': expandMap[index] }"
          @click="expandMap[index] = !expandMap[index]"
          name="arrow_right"
        />
        <template v-for="index in log.length - 1" :key="index">
          <span class="briefly-block" v-html="logBriefly(log[index])"> </span>
          &thinsp;
        </template>
      </div>
      <div v-if="expandMap[index]">
        <json-viewer :value="log"></json-viewer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import JsonViewer from "vue-json-viewer";
import { ref, defineProps, watch } from "vue";

const { logs = [], brieflyLimit = 10 } = defineProps<{
  logs: any[];
  brieflyLimit?: number;
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
        .slice(0, brieflyLimit)
        .map((item) => logBriefly(item, true))
        .join(", ")}${briefly.length > brieflyLimit ? ",..." : ""}](${
        briefly.length
      })`;
    } else {
      return `{${Object.keys(briefly)
        .slice(0, brieflyLimit)
        .map((key) => `${key}: ${logBriefly(briefly[key], true)}`)
        .join(", ")}${
        Object.keys(briefly).length > brieflyLimit ? ",..." : ""
      }}`;
    }
  }
  return briefly;
}

const expandMap = ref<{ [key: number]: boolean }>({});
watch($$(logs), () => {
  expandMap.value = {};
});
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

:deep(.jv-container .jv-code) {
  padding: 0;
  padding-left: 10px;
}
:deep(.jv-container.jv-light .jv-item.jv-array) {
  color: #fff;
}

:deep(.jv-container.jv-light .jv-item.jv-object) {
  color: #fff;
}

:deep(.jv-container.jv-light .jv-item.jv-string) {
  color: #f60;
}

:deep(.jv-container.jv-light .jv-item.jv-number) {
  color: #7070ff;
}

:deep(.jv-container.jv-light .jv-key) {
  color: #fff;
}

:deep(.jv-container.jv-light) {
  background-color: #333;
  color: #fff;
}
</style>

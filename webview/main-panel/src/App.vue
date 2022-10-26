<template>
  <q-layout view="lHh lpR lFf">
    <q-drawer v-model="leftDrawerOpen" side="left" bordered>
      <!-- drawer content -->
      <!-- <q-drawer-sticky position="top-left" :offset="[0, 0]"> -->
      <!-- <q-btn-group
          :flat="true"
          :glossy="false"
          :rounded="false"
          :outline="false"
          :unelevated="true"
          :square="true"
        >
          <q-btn size="xs" color="primary" icon="shopping_cart" />
          <q-btn size="xs" color="secondary" icon="navigation" />
        </q-btn-group> -->

      <q-toolbar>
        <!-- <q-btn
          flat
          round
          dense
          icon="radio_button_checked"
          class="q-mr-sm"
          color="red"
        />
        <q-separator dark vertical inset /> -->
        <q-btn
          flat
          round
          dense
          icon="query_stats"
          class="q-ml-sm"
          @click="onDiff"
        />
        <q-btn
          flat
          round
          dense
          icon="auto_graph"
          class="q-ml-sm"
          @click="onMultiDiff"
        />
        <q-btn
          flat
          round
          dense
          icon="delete"
          class="q-ml-sm"
          @click="onClear"
        />
      </q-toolbar>
      <q-separator dark />
      <q-expansion-item
        v-for="[snapId, pageEvent] in pageEventSnapMap"
        :key="String(pageEvent)"
      >
        <template v-slot:header>
          <q-item-section avatar>
            <q-avatar icon="text_snippet" text-color="white" />
          </q-item-section>

          <q-item-section no-wrap>
            <q-item-label>{{ mapWrap(String(snapId)) }}</q-item-label>
            <q-item-label caption>{{ snapId }}</q-item-label>
          </q-item-section>

          <q-item-section side>
            <div class="row">
              <q-btn icon="edit" flat round dense size="sm">
                <q-popup-edit
                  :model-value="mapWrap(String(snapId))"
                  @update:model-value="setMap(snapId, $event)"
                  auto-save
                  v-slot="scope"
                >
                  <q-input
                    v-model="scope.value"
                    dense
                    autofocus
                    counter
                    @keyup.enter="scope.set"
                  />
                </q-popup-edit>
              </q-btn>
            </div>
          </q-item-section>
        </template>
        <q-list bordered separator>
          <q-item
            v-for="[page, eventLogs] in pageEvent"
            :key="page"
            clickable
            v-ripple
            @click="onClickPageItem(eventLogs, page)"
          >
            <q-item-section>{{ page }}</q-item-section>
            <q-item-label caption>{{ eventLogs.length }}</q-item-label>
          </q-item>
        </q-list>
      </q-expansion-item>
      <!-- </q-drawer-sticky> -->
    </q-drawer>

    <q-page-container>
      <q-page v-if="viewRoute === 'log'">
        <q-splitter v-model="splitterModel" horizontal style="height: 100vh">
          <template v-slot:before>
            <div class="q-pa-md">
              <div class="text-h4 q-mb-md">Before</div>
              <div v-for="n in 10" :key="n" class="q-my-md">
                {{ n }}. Lorem ipsum dolor sit, amet consectetur adipisicing
                elit. Quis praesentium cumque magnam odio iure quidem, quod
                illum numquam possimus obcaecati commodi minima assumenda
                consectetur culpa fuga nulla ullam. In, libero.
              </div>
            </div>
          </template>

          <template v-slot:after>
            <div>
              <div class="fixed-top text-center bg-dark" style="height: 20px">
                {{ activeSnap }} => {{ activePage }}
              </div>
              <div style="height: 20px"></div>
              <q-separator dark />

              <Console :logs="eventLogs"></Console>
            </div>
          </template>
        </q-splitter>
        <q-page-sticky
          position="top-left"
          :offset="[0, 10]"
          @click="onToggleLeftDrawer"
        >
          <q-btn round color="dark" icon="menu" />
        </q-page-sticky>
      </q-page>
      <q-page v-else-if="viewRoute === 'diff'">
        <q-splitter :model-value="70" horizontal style="height: 100vh">
          <template v-slot:before>
            <div class="row">
              <q-select
                class="col"
                v-model="selectSourceSnap"
                :options="snapOptions"
                label="SourceSnap"
                dense
                emit-value
                map-options
              />
              <q-select
                class="col"
                v-model="selectSourcePage"
                :options="sourcePageOptions"
                label="SourcePage"
                dense
              />
              <q-select
                class="col"
                v-model="selectTargetSnap"
                :options="snapOptions"
                label="TargetSnap"
                dense
                emit-value
                map-options
              />
              <q-select
                class="col"
                v-model="selectTargetPage"
                :options="targetPageOptions"
                label="TargetPage"
                dense
              />
            </div>
            <q-splitter :model-value="50">
              <template v-slot:before>
                <div>
                  <div class="text-center">
                    {{ selectSourceSnap }} => {{ selectSourcePage }} ({{
                      sourceLogs.length
                    }})
                  </div>
                  <q-separator dark />

                  <Console :logs="sourceLogs"></Console>
                </div>
              </template>

              <template v-slot:after>
                <div>
                  <div class="text-center">
                    {{ selectTargetSnap }} => {{ selectTargetPage }} ({{
                      targetLogs.length
                    }})
                  </div>

                  <q-separator dark />

                  <Console :logs="targetLogs"></Console>
                </div>
              </template>
            </q-splitter>
          </template>

          <template v-slot:after>
            <div>
              <div class="text-center">Diff Stats</div>
              <q-separator dark />

              <Console :logs="diffLogs"></Console>
            </div>
          </template>
        </q-splitter>
        <q-page-sticky
          position="top-left"
          :offset="[0, 10]"
          @click="onToggleLeftDrawer"
        >
          <q-btn round color="dark" icon="menu" />
        </q-page-sticky>
      </q-page>
      <q-page v-else-if="viewRoute === 'multi-diff'">
        <q-splitter :model-value="70" horizontal style="height: 100vh">
          <template v-slot:before>
            <div class="row">
              <q-select
                class="col"
                v-model="selectMultiSourceSnap"
                :options="snapOptions"
                label="选择多个源快照"
                dense
                multiple
                emit-value
                map-options
              />
              <q-select
                class="col"
                v-model="selectMultiTargetSnap"
                :options="snapOptions"
                label="选择多个目标快照"
                dense
                multiple
                emit-value
                map-options
              />
              <div class="col row">
                <q-select
                  class="col"
                  v-model="selectDiffPage"
                  :options="diffPageOptions"
                  label="选择比较的页面"
                  dense
                />
                <q-btn label="设置" flat>
                  <q-menu>
                    <div class="row no-wrap q-pa-md">
                      <div class="column">
                        <div class="text-h6 q-mb-md">设置</div>
                        <q-toggle
                          v-model="includeMaxMin"
                          label="包含最大值和最小值"
                        />
                        <!-- <q-toggle v-model="bluetooth" label="Bluetooth" /> -->
                      </div>
                    </div>
                  </q-menu>
                </q-btn>
              </div>
            </div>
            <q-splitter :model-value="50">
              <template v-slot:before>
                <div>
                  <div class="text-center">源快照数据指标</div>
                  <q-separator dark />

                  <Console :logs="multiSourceLogs"></Console>
                </div>
              </template>

              <template v-slot:after>
                <div>
                  <div class="text-center">目标快照数据指标</div>

                  <q-separator dark />

                  <Console :logs="multiTargetLogs"></Console>
                </div>
              </template>
            </q-splitter>
          </template>

          <template v-slot:after>
            <div>
              <div class="text-center">比较结果</div>
              <q-separator dark />

              <Console :logs="multiDiffLogs"></Console>
            </div>
          </template>
        </q-splitter>
        <q-page-sticky
          position="top-left"
          :offset="[0, 10]"
          @click="onToggleLeftDrawer"
        >
          <q-btn round color="dark" icon="menu" />
        </q-page-sticky>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts" setup>
import Console from "./components/Console.vue";
import { computed, ref, watch, watchEffect } from "vue";
import { BindServer } from "./BindServer";

const { snapLabelMap, setMap, mapWrap } = useSnapLabel();

function useSnapLabel() {
  const snapLabelMap = ref(new Map<string, string>());
  function setMap(snapId: string, label: string) {
    const oldLabel = snapLabelMap.value.get(snapId);
    if (oldLabel) {
      snapLabelMap.value.delete(oldLabel);
    }
    snapLabelMap.value.set(snapId, label);
    snapLabelMap.value.set(label, snapId);
  }
  function mapWrap(snapId: string) {
    return snapLabelMap.value.get(snapId) || snapId;
  }
  return {
    snapLabelMap,
    setMap,
    mapWrap,
  };
}

const splitterModel = ref(0);
const pageEventSnapMap = ref(new Map());

const bindServer = new BindServer();

const eventLogs = ref<any>([]);
const activeSnap = ref("");
const activePage = ref("");

const viewRoute = ref("log"); // log | diff

const {
  snapOptions,
  sourcePageOptions,
  targetPageOptions,
  selectSourceSnap,
  selectSourcePage,
  selectTargetSnap,
  selectTargetPage,
  sourceLogs,
  targetLogs,
  diffLogs,
} = useDiff();

const {
  selectMultiSourceSnap,
  selectMultiTargetSnap,
  selectDiffPage,
  diffPageOptions,
  includeMaxMin,
  multiSourceLogs,
  multiTargetLogs,
  multiDiffLogs,
} = useMultiDiff();

// ------------------------------------

const entryNameZh = {
  appLaunch: "小程序启动(appLaunch)",
  route: "路由准备(route)",
  firstRender: "首次渲染(firstRender)",
  firstPaint: "首次绘制(firstPaint)",
  firstContentfulPaint: "首次内容绘制(firstContentfulPaint))",
  largestContentfulPaint: "最大内容绘制(largestContentfulPaint)",
  evaluateScript: "逻辑层代码注入(evaluateScript)",
  downloadPackage: "代码包下载(downloadPackage)",
  resourceTiming: "视图层资源加载(resourceTiming)",
  viewLayerReady: "准备渲染(viewLayerReady)",
  viewLayerRenderStart: "开始渲染(viewLayerRenderStart)",
  viewLayerRenderEnd: "结束渲染(viewLayerRenderEnd)",
  initDataSend: "逻辑层发送Data(initDataSend)",
  initDataRecv: "渲染层接收Data(initDataRecv)",
  flushViewed: "刷新渲染层(flushViewed)",
  navigationStart: "路由开始(navigationStart)",
  navigationEnd: "路由结束(navigationEnd)",
};

bindServer.on("pushSnapPage", (data: any) => {
  const snapId = data.snapId;
  const page = data.page;
  const entry = data.entry;

  let snap = pageEventSnapMap.value.get(snapId);
  if (!snap) {
    snap = new Map();
    pageEventSnapMap.value.set(snapId, snap);
  }

  const logs = snap.get(page);
  if (!logs) {
    bindServer.emit("syncSnapPage", {
      snapId,
      page,
    });
    return;
  }
  logs.push(entry);
  activePage.value = page;
  activeSnap.value = snapId;
  eventLogs.value = eventLogsFormat(logs);
});

bindServer.on("postSnapPage", (data: any) => {
  const snapId = data.snapId;
  const page = data.page;
  const entries = data.entries;
  console.log(data);

  let snap = pageEventSnapMap.value.get(snapId);
  if (!snap) {
    snap = new Map();
    pageEventSnapMap.value.set(snapId, snap);
  }

  let logs: any[] = snap.get(page);
  if (!logs) {
    logs = [];
    snap.set(page, logs);
  }
  logs.splice(0, logs.length, ...entries);
  activePage.value = page;
  activeSnap.value = snapId;
  eventLogs.value = eventLogsFormat(logs);
});

bindServer.on("postSnap", (pageEvent: any) => {
  pageEventSnapMap.value.set(pageEvent.snapId, new Map(pageEvent.pageMap));
  activeSnap.value = pageEvent.snapId;
  activePage.value = pageEventSnapMap.value
    .get(activeSnap.value)
    .keys()
    .next().value;
  console.log(pageEventSnapMap.value);
});

function onClickPageItem(logs: any, page: string) {
  const tlogs: any[] = [];
  tlogs.push(...analysisDataFormatLog(analysisData(logs)));
  tlogs.push(["line"]);
  tlogs.push(...eventLogsFormat(logs));
  eventLogs.value = tlogs;
  activePage.value = page;
  viewRoute.value = "log";
}

function eventLogsFormat(logs: any) {
  const first = logs[0];
  const fLogs = [];

  for (let i = 0; i < logs.length; i++) {
    const entry = logs[i];
    let duration = entry.duration;
    if (duration === undefined) {
      duration = "x";
    }
    const log = [
      "info",
      entry.entryType,
      entryNameZh[entry.name as "route"] || entry.name,
      "|时间:",
      entry.startTime % 100000,
      "|持续:",
      entry.startTime - first.startTime,
      "|耗时:",
      duration,
    ];
    if (entry.keys) {
      log.push("|keys:", entry.keys);
    }
    fLogs.push(log);
  }

  return fLogs;
}

function onClear() {
  pageEventSnapMap.value.clear();
  eventLogs.value = [];
  bindServer.emit("clear", "");
}

function onDiff() {
  viewRoute.value = "diff";
  onToggleLeftDrawer();
}

function onMultiDiff() {
  viewRoute.value = "multi-diff";
  onToggleLeftDrawer();
}

const leftDrawerOpen = ref(true);

function onToggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
  console.log(leftDrawerOpen.value);
}

function analysisData(list: any[]) {
  list = list.sort((a: any, b: any) => a.startTime - b.startTime);

  const stats: any = {
    $m: [],
  };
  const first = list.find((item) => item.name === "onPreload") || list[0];

  const navigationStart = list.find((item) => item.name === "navigationStart");
  if (navigationStart) {
    stats.$m.push({
      title: "逻辑层初始化耗时（代码注入）",
      key: "jsInit",
    });
    stats.jsInit = navigationStart.startTime - first.startTime;
  }

  const viewLayerRenderStart = list.find(
    (item) => item.name === "viewLayerRenderStart"
  );
  if (viewLayerRenderStart) {
    stats.$m.push({
      title: "视图层初始化耗时（资源加载）",
      key: "viewInit",
    });
    stats.viewInit = viewLayerRenderStart.startTime - first.startTime;
  }

  const viewLayerRenderEnd = list.find(
    (item) => item.name === "viewLayerRenderEnd"
  );
  if (viewLayerRenderEnd) {
    stats.$m.push({
      title: "首次渲染完成耗时（onPreload -> 结束渲染）",
      key: "firstRender",
    });
    stats.firstRender = viewLayerRenderEnd.startTime - first.startTime;
  }

  const largestContentfulPaint = list.filter(
    (item) => item.name === "largestContentfulPaint"
  );
  const routeEnd = largestContentfulPaint[largestContentfulPaint.length - 1];
  if (routeEnd) {
    if (navigationStart) {
      stats.$m.push({
        title: "总耗时（路由开始 -> 最后一次最大内容绘制）",
        key: "loadRoute",
      });
      stats.loadRoute = routeEnd.startTime - navigationStart.startTime;
    }
    stats.$m.push({
      title: "总耗时（onPreload -> 最后一次最大内容绘制）",
      key: "loadPage",
    });
    stats.loadPage = routeEnd.startTime - first.startTime;
  }
  return stats;
}

function analysisDataFormatLog(stats: any) {
  const logs: any[] = [];
  stats.$m.forEach((item: any) => {
    logs.push([
      "info",
      item.title,
      stats[item.key] === undefined ? "x" : stats[item.key],
      "ms",
    ]);
  });
  return logs;
}

function useMultiDiff() {
  const selectMultiSourceSnap = ref([]);
  const selectMultiTargetSnap = ref([]);
  const selectDiffPage = ref("");
  const includeMaxMin = ref(true);

  const diffPageOptions = computed(() => {
    const commonPages = new Set();

    for (const snap of [
      ...selectMultiSourceSnap.value,
      ...selectMultiTargetSnap.value,
    ]) {
      for (const page of (pageEventSnapMap.value.get(snap)?.keys() as any) ||
        []) {
        commonPages.add(page);
      }
    }

    return Array.from(commonPages);
  });

  function multiSnapMergeLogs(
    selectMultiSourceSnap: string[],
    page: string = selectDiffPage.value
  ) {
    const logs: any[] = [];
    let statsCount: any = {};
    for (const snap of selectMultiSourceSnap) {
      const pageLogs = pageEventSnapMap.value.get(snap)?.get(page);
      if (pageLogs) {
        const stats = analysisData(pageLogs);
        logs.push(["line"]);
        logs.push(["info", "快照:", mapWrap(snap)]);
        logs.push(...analysisDataFormatLog(stats));
        stats.$m.forEach((item: any) => {
          const prevVal = statsCount[item.key]?.value || 0;
          const prevCount = statsCount[item.key]?.count || 0;
          const prevMin = statsCount[item.key]?.min || Number.MAX_SAFE_INTEGER;
          const prevMax = statsCount[item.key]?.max || 0;
          statsCount[item.key] = {
            ...item,
            value: stats[item.key] + prevVal,
            count: prevCount + 1,
            max: Math.max(stats[item.key], prevMax),
            min: Math.min(stats[item.key], prevMin),
          };
        });
      }
    }
    const statsCountLogs = [["info", "聚合平均值"]];
    for (const key in statsCount) {
      const item = statsCount[key];
      if (!includeMaxMin.value) {
        item.value = item.value - item.max - item.min;
        item.count = item.count - 2;
      }
      statsCountLogs.push(["info", item.title, item.value / item.count, "ms"]);
    }

    logs.unshift(...statsCountLogs);
    return {
      logs,
      statsCount,
    };
  }

  const multiSourceLogs = computed(() => {
    return multiSnapMergeLogs(selectMultiSourceSnap.value).logs;
  });

  const multiTargetLogs = computed(() => {
    return multiSnapMergeLogs(selectMultiTargetSnap.value).logs;
  });

  const multiDiffLogs = computed(() => {
    const source = multiSnapMergeLogs(selectMultiSourceSnap.value).statsCount;
    const target = multiSnapMergeLogs(selectMultiTargetSnap.value).statsCount;
    const logs: any[] = [];

    for (const key in source) {
      if (target[key]) {
        const sourceItem = source[key];
        const targetItem = target[key];
        const sourceAvg = sourceItem.value / sourceItem.count;
        const targetAvg = targetItem.value / targetItem.count;
        const diff = targetAvg - sourceAvg;
        logs.push([
          "info",
          sourceItem.title,
          diff,
          "ms",
          `(${sourceAvg} -> ${targetAvg})`,
          diff > 0 ? "↑" : "↓",
          `<span class="text-${diff > 0 ? "red" : "green"}">${(
            Math.abs(diff / sourceAvg) * 100
          ).toFixed(2)}%</span>`,
        ]);
      }
    }

    return logs;
  });

  return {
    selectDiffPage,
    diffPageOptions,
    selectMultiSourceSnap,
    selectMultiTargetSnap,
    includeMaxMin,
    multiSourceLogs,
    multiTargetLogs,
    multiDiffLogs,
  };
}

function useDiff() {
  const selectSourceSnap = ref("");
  const selectSourcePage = ref("");
  const selectTargetSnap = ref("");
  const selectTargetPage = ref("");
  const sourceRawLogs = computed(
    () =>
      pageEventSnapMap.value
        ?.get(selectSourceSnap.value)
        ?.get(selectSourcePage.value) || []
  );
  const sourceLogs = computed(() => {
    const logs: any[] = [];
    logs.push(...analysisDataFormatLog(analysisData(sourceRawLogs.value)));
    logs.push(["line"]);
    logs.push(...eventLogsFormat(sourceRawLogs.value));
    return logs;
  });
  const targetRawLogs = computed(
    () =>
      pageEventSnapMap.value
        ?.get(selectTargetSnap.value)
        ?.get(selectTargetPage.value) || []
  );
  const targetLogs = computed(() => {
    const tlogs: any[] = [];
    tlogs.push(...analysisDataFormatLog(analysisData(targetRawLogs.value)));
    tlogs.push(["line"]);
    tlogs.push(...eventLogsFormat(targetRawLogs.value));
    return tlogs;
  });
  const diffLogs = computed(() => {
    const source = sourceRawLogs.value;
    const sourceStatsMap = eventLogsStats(source);
    const sourceCount = analysisData(source);
    const target = targetRawLogs.value;
    const targetStatsMap = eventLogsStats(target);
    const targetCount = analysisData(target);
    const diffLogs = [];

    console.log(sourceCount, targetCount);

    for (const item of sourceCount.$m) {
      if (targetCount[item.key] === undefined) {
        continue;
      }
      const val = targetCount[item.key] - sourceCount[item.key];
      diffLogs.push([
        "info",
        item.title,
        val,
        "ms",
        val > 0 ? "↑" : "↓",
        `${(Math.abs(val / targetCount[item.key]) * 100).toFixed(2)}%`,
      ]);
    }

    diffLogs.push(["line"]);

    for (const [key, value] of sourceStatsMap) {
      const targetValue = targetStatsMap.get(key);
      if (targetValue) {
        const statsValue = value[0];
        const statsTargetValue = targetValue[0];
        diffLogs.push([
          "info",
          entryNameZh[key as "route"] ?? key,
          " | ",
          diffCalc(statsValue, statsTargetValue, "count"),
          " | ",
          diffCalc(statsValue, statsTargetValue, "avg"),
          " | ",
          diffCalc(statsValue, statsTargetValue, "max"),
          " | ",
          diffCalc(statsValue, statsTargetValue, "min"),
        ]);
      }
    }

    return diffLogs;

    function diffCalc(statsValue: any, targetStatsValue: any, key: string) {
      const ex = key === "avg" ? 2 : 0;
      let diffValue = targetStatsValue[key] - statsValue[key];
      const scale = formatNumber((diffValue / statsValue[key]) * 100).toFixed(
        2
      );
      diffValue = diffValue.toFixed(ex) as any;
      return `${key}(${scale}%${
        diffValue == 0 ? "" : diffValue > 0 ? "↑" : "↓"
      }): ${statsValue[key].toFixed(ex)} -> ${targetStatsValue[key].toFixed(
        ex
      )} -> ${diffValue}`;
    }

    function formatNumber(n: number) {
      if (n !== n) {
        // NAN
        return 0;
      }
      if (!Number.isFinite(n)) {
        return 0;
      }
      return n;
    }

    function eventLogsStats(logs: any[]) {
      const entryMap = new Map();

      for (let i = 0; i < logs.length; i++) {
        const log = logs[i];

        let entryList = entryMap.get(log.name);
        if (!entryList) {
          entryList = [
            {
              name: log.name,
              sum: 0,
              avg: 0,
              min: 0,
              max: 0,
              count: 0,
            },
          ];
          entryMap.set(log.name, entryList);
        }
        const stats = entryList[0];
        const duration = log.duration || 0;
        stats.sum += duration;
        stats.avg = stats.sum / ++stats.count;
        stats.min = Math.min(stats.min, duration);
        stats.max = Math.max(stats.max, duration);
        entryList.push(log);
      }

      return entryMap;
    }
  });

  const snapOptions = computed(() => {
    const snapKeys = [...pageEventSnapMap.value.keys()];
    return snapKeys.map((snapId) => ({
      label: mapWrap(snapId),
      value: snapId,
    }));
  });

  const sourcePageOptions = computed(() => {
    return [
      ...(pageEventSnapMap.value.get(selectSourceSnap.value)?.keys() || []),
    ];
  });
  const targetPageOptions = computed(() => {
    return [
      ...(pageEventSnapMap.value.get(selectTargetSnap.value)?.keys() || []),
    ];
  });

  return {
    selectSourceSnap,
    selectSourcePage,
    selectTargetSnap,
    selectTargetPage,
    sourceLogs,
    targetLogs,
    diffLogs,
    snapOptions,
    sourcePageOptions,
    targetPageOptions,
  };
}
</script>

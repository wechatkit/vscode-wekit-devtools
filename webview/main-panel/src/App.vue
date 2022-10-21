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
          icon="delete"
          class="q-ml-sm"
          @click="onClear"
        />
      </q-toolbar>
      <q-separator dark />
      <q-expansion-item
        v-for="[snapId, pageEvent] in pageEventSnapMap"
        :key="String(pageEvent)"
        icon="text_snippet"
        :label="String(snapId)"
      >
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
      <q-page v-else>
        <q-splitter :model-value="70" horizontal style="height: 100vh">
          <template v-slot:before>
            <div class="row">
              <q-select
                class="col"
                v-model="selectSourceSnap"
                :options="snapOptions"
                label="SourceSnap"
                dense
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
    </q-page-container>
  </q-layout>
</template>

<script lang="ts" setup>
import Console from "./components/Console.vue";
import { computed, ref, watch } from "vue";
import { BindServer } from "./BindServer";
import { stat } from "fs";
const splitterModel = ref(0);
const pageEventSnapMap = ref(new Map());

const bindServer = new BindServer();

const eventLogs = ref<any>([]);
const activeSnap = ref("");
const activePage = ref("");

const viewRoute = ref("log"); // log | diff

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
  return eventLogsFormat(sourceRawLogs.value);
});
const targetRawLogs = computed(
  () =>
    pageEventSnapMap.value
      ?.get(selectTargetSnap.value)
      ?.get(selectTargetPage.value) || []
);
const targetLogs = computed(() => {
  return eventLogsFormat(targetRawLogs.value);
});
const diffLogs = computed(() => {
  const source = sourceRawLogs.value;
  const sourceStatsMap = eventLogsStats(source);
  const target = targetRawLogs.value;
  const targetStatsMap = eventLogsStats(target);
  const diff = [];

  for (const [key, value] of sourceStatsMap) {
    const targetValue = targetStatsMap.get(key);
    if (targetValue) {
      const statsValue = value[0];
      const statsTargetValue = targetValue[0];
      diff.push([
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

  return diff;

  function diffCalc(statsValue: any, targetStatsValue: any, key: string) {
    const ex = key === "avg" ? 2 : 0;
    let diffValue = targetStatsValue[key] - statsValue[key];
    const scale = formatNumber((diffValue / statsValue[key]) * 100).toFixed(2);
    diffValue = diffValue.toFixed(ex) as any;
    return `${key}(${scale}%${
      diffValue == 0 ? "" : diffValue > 0 ? "↑" : "↓"
    }): ${statsValue[key].toFixed(ex)} -> ${targetStatsValue[key].toFixed(
      ex
    )} => ${diffValue}`;
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
  return snapKeys;
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
  logs = logs.sort((a: any, b: any) => a.startTime - b.startTime);
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
}

const leftDrawerOpen = ref(true);

function onToggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
  console.log(leftDrawerOpen.value);
}

function analysisData(list: any[]) {
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
</script>

<template>
  <q-layout view="lHh lpR lFf">
    <q-drawer :model-value="true" side="left" bordered>
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
        <q-btn flat round dense icon="query_stats" class="q-ml-sm" />
        <q-btn flat round dense icon="delete" class="q-ml-sm" />
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
      <q-page>
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
              <div style="text-align: center">
                {{ activeSnap }} => {{ activePage }}
              </div>
              <q-separator dark />

              <Console :logs="eventLogs"></Console>
            </div>
          </template>
        </q-splitter>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts" setup>
import Console from "./components/Console.vue";
import { ref } from "vue";
import { BindServer } from "./BindServer";
const splitterModel = ref(0);
const pageEventSnapMap = ref(new Map());

const bindServer = new BindServer();

const eventLogs = ref<any>([]);
const activeSnap = ref("");
const activePage = ref("");

const entryNameZh = {
  appLaunch: "小程序启动",
  route: "路由准备",
  firstRender: "首次渲染",
  firstPaint: "首次绘制",
  firstContentfulPaint: "首次内容绘制",
  largestContentfulPaint: "最大内容绘制",
  evaluateScript: "逻辑层代码注入",
  downloadPackage: "代码包下载",
  resourceTiming: "视图层资源加载",
  viewLayerReady: "准备渲染",
  viewLayerRenderStart: "开始渲染",
  viewLayerRenderEnd: "结束渲染",
  initDataSend: "逻辑层发送Data",
  initDataRecv: "渲染层接收Data",
  flushViewed: "刷新渲染层",
  navigationStart: "路由开始",
  navigationEnd: "路由结束",
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
  eventLogs.value = eventLogsFormat(logs);
  activePage.value = page;
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
    fLogs.push([
      "info",
      entry.entryType,
      entryNameZh[entry.name as "route"] || entry.name,
      "|时间:",
      entry.startTime % 100000,
      "|持续:",
      entry.startTime - first.startTime,
      "|耗时:",
      duration,
    ]);
  }

  return fLogs;
}

const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
</script>

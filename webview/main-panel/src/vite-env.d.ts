/// <reference types="vite/client" />

function acquireVsCodeApi(): any;

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

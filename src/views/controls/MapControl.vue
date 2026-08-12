<script setup lang="ts">
import {onMounted, onUnmounted, ref, type Ref, shallowRef, watch} from 'vue';
import {BoxGeometry, Mesh, MeshBasicMaterial, Scene} from 'three';
import {MapControls} from 'three/examples/jsm/controls/MapControls.js';
import RendererHelper from '../../core/helpers/RendererHelper';
import PerspectiveCameraHelper from '../../core/helpers/PerspectiveCameraHelper';
import {RenderMonitor} from '../../core/RenderMonitor.ts';

const el = shallowRef() as Ref<HTMLDivElement>;
let rendererHelper: RendererHelper;
let perspectiveCameraHelper: PerspectiveCameraHelper;
let control: MapControls;
const screenSpacePanning = ref(false);
const zoomToCursor = ref(true);

watch(screenSpacePanning, value => {
  control.screenSpacePanning = value;
});

watch(zoomToCursor, value => {
  control.zoomToCursor = value;
});

onMounted(() => {
  rendererHelper = new RendererHelper(el.value);
  const renderer = rendererHelper.renderer;
  new RenderMonitor(renderer);
  perspectiveCameraHelper = new PerspectiveCameraHelper(renderer.domElement);
  const camera = perspectiveCameraHelper.camera;
  camera.position.set(4, 4, 4);

  const scene = new Scene();
  const geometry = new BoxGeometry(1, 1, 1);
  const material = new MeshBasicMaterial({color: 0xff0000});
  const cube = new Mesh(geometry, material);
  scene.add(cube);

  control = new MapControls(camera, renderer.domElement);
  control.zoomToCursor = true;
  control.addEventListener('change', () => {
    rendererHelper.needUpdate();
  })

  rendererHelper.startLoop(scene, camera);
});

onUnmounted(() => {
  rendererHelper.dispose();
  perspectiveCameraHelper.dispose();
  control.dispose();
});
</script>

<template>
  <div class="h-full relative">
    <div class="h-full" ref="el">
    </div>
    <div class="rounded-lg w-xs space-y-2 p-2 absolute left-2 top-2 bg-default">
      <div>
        <USwitch label="屏幕方向平移" v-model="screenSpacePanning"></USwitch>
      </div>
      <div class="text-sm text-muted">定义平移视图时相机的平移方式。如果设置为
        true，相机将在屏幕空间（相机镜头的 XY 平面）中平移。否则，相机将在垂直于相机“向上方向”（Up
        向量）的平面（XZ 平面）内平移。默认为 true。
      </div>
      <div>
        <USwitch label="缩放至鼠标所在位置" v-model="zoomToCursor"></USwitch>
      </div>
      <div class="text-sm text-muted">将此属性设置为 true 时，可以实现以光标（鼠标指针）所在的位置为中心进行缩放。默认为
        false。
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>

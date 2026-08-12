<script setup lang="ts">
import {onMounted, type Ref, shallowRef, watch, reactive, onUnmounted} from 'vue';
import {Mesh, MeshBasicMaterial, Scene, Shape, ExtrudeGeometry} from 'three';
import {MapControls} from 'three/examples/jsm/controls/MapControls.js';
import type {ExtrudeGeometryOptions} from 'three/src/geometries/ExtrudeGeometry.js';
import RendererHelper from '../../core/helpers/RendererHelper';
import PerspectiveCameraHelper from '../../core/helpers/PerspectiveCameraHelper';
import {RenderMonitor} from '../../core/RenderMonitor.ts';

const el = shallowRef() as Ref<HTMLDivElement>;
let rendererHelper: RendererHelper;
let perspectiveCameraHelper: PerspectiveCameraHelper;
let control: MapControls;

const option = reactive<ExtrudeGeometryOptions>({
  // 曲线上点的数量
  curveSegments: 12,
  // 用于沿着挤出样条的深度细分的点的数量
  steps: 1,
  // 挤出的形状的深度
  depth: 1,
  // 对挤出的形状应用是否斜角
  bevelEnabled: true,
  // 斜角的厚度
  bevelThickness: 0.2,
  // 斜角与原始形状轮廓之间的延伸距离
  bevelSize: 0.1,
  // 斜角与原始形状的偏移量
  bevelOffset: 0,
  // 斜角的分段层数
  bevelSegments: 3
});
let geometry: ExtrudeGeometry;
let cube: Mesh;
let shape: Shape;

watch(option, () => {
  geometry.dispose();
  geometry = new ExtrudeGeometry(shape, option);
  cube.geometry = geometry;
  rendererHelper.needUpdate();
});

onMounted(() => {
  rendererHelper = new RendererHelper(el.value);
  const renderer = rendererHelper.renderer;
  new RenderMonitor(renderer);
  perspectiveCameraHelper = new PerspectiveCameraHelper(renderer.domElement);
  const camera = perspectiveCameraHelper.camera;
  camera.position.set(15, 0, 15);

  const scene = new Scene();
  shape = new Shape();
  const x = -2.5;
  const y = -5;
  shape.moveTo(x + 2.5, y + 2.5);
  shape.bezierCurveTo(x + 2.5, y + 2.5, x + 2, y, x, y);
  shape.bezierCurveTo(x - 3, y, x - 3, y + 3.5, x - 3, y + 3.5);
  shape.bezierCurveTo(x - 3, y + 5.5, x - 1.5, y + 7.7, x + 2.5, y + 9.5);
  shape.bezierCurveTo(x + 6, y + 7.7, x + 8, y + 4.5, x + 8, y + 3.5);
  shape.bezierCurveTo(x + 8, y + 3.5, x + 8, y, x + 5, y);
  shape.bezierCurveTo(x + 3.5, y, x + 2.5, y + 2.5, x + 2.5, y + 2.5);
  geometry = new ExtrudeGeometry(shape, option);

  const material = new MeshBasicMaterial({wireframe: true});
  cube = new Mesh(geometry, material);
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
  </div>
  <div class="rounded-lg w-xs space-y-2 p-2 absolute left-2 top-2 bg-default">
    <div>
      曲线上点的数量
      <UInputNumber v-model="option.curveSegments"></UInputNumber>
    </div>
    <div>
      挤出样条的深度细分的点的数量
      <UInputNumber v-model="option.steps"></UInputNumber>
    </div>
    <div>
      挤出形状的深度
      <UInputNumber v-model="option.depth"></UInputNumber>
    </div>
    <div>
      对挤出的形状应用是否斜角
      <USwitch v-model="option.bevelEnabled"></USwitch>
    </div>
    <div>
      斜角的厚度
      <UInputNumber v-model="option.bevelThickness"></UInputNumber>
    </div>
    <div>
      斜角与原始形状轮廓之间的延伸距离
      <UInputNumber v-model="option.bevelSize"></UInputNumber>
    </div>
    <div>
      斜角与原始形状的偏移量
      <UInputNumber v-model="option.bevelOffset"></UInputNumber>
    </div>
    <div>
      斜角的分段层数
      <UInputNumber v-model="option.bevelSegments"></UInputNumber>
    </div>
  </div>
</template>

<style scoped>

</style>

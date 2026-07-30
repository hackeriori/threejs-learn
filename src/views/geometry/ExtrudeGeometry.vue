<script setup lang="ts">
import {onMounted, type Ref, shallowRef, watch, reactive, onUnmounted} from 'vue';
import {Mesh, MeshBasicMaterial, Scene, Shape, ExtrudeGeometry} from 'three';
import {MapControls} from 'three/examples/jsm/controls/MapControls';
import type {ExtrudeGeometryOptions} from 'three/src/geometries/ExtrudeGeometry';
import RendererHelper from '@/core/helpers/RendererHelper';
import PerspectiveCameraHelper from '@/core/helpers/PerspectiveCameraHelper';

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

watch(option, value => {
  geometry.dispose();
  geometry = new ExtrudeGeometry(shape, option);
  cube.geometry = geometry;
});

onMounted(() => {
  rendererHelper = new RendererHelper(el.value);
  const renderer = rendererHelper.renderer;
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

  function animate() {
    control.update();
    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(animate);
});

onUnmounted(() => {
  rendererHelper.dispose();
  perspectiveCameraHelper.dispose();
  control.dispose();
});
</script>

<template>
  <div class="height100 ls-abs-outer">
    <div class="height100" ref="el">
    </div>
  </div>
  <div class="controlBox">
    <div>
      曲线上点的数量
      <el-input-number v-model="option.curveSegments"></el-input-number>
    </div>
    <div>
      挤出样条的深度细分的点的数量
      <el-input-number v-model="option.steps"></el-input-number>
    </div>
    <div>
      挤出形状的深度
      <el-input-number v-model="option.depth"></el-input-number>
    </div>
    <div>
      对挤出的形状应用是否斜角
      <el-switch v-model="option.bevelEnabled"></el-switch>
    </div>
    <div>
      斜角的厚度
      <el-input-number v-model="option.bevelThickness"></el-input-number>
    </div>
    <div>
      斜角与原始形状轮廓之间的延伸距离
      <el-input-number v-model="option.bevelSize"></el-input-number>
    </div>
    <div>
      斜角与原始形状的偏移量
      <el-input-number v-model="option.bevelOffset"></el-input-number>
    </div>
    <div>
      斜角的分段层数
      <el-input-number v-model="option.bevelSegments"></el-input-number>
    </div>
  </div>
</template>

<style scoped>

</style>

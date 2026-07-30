<script setup lang="ts">
import {onMounted, onUnmounted, ref, type Ref, shallowRef, watch} from 'vue';
import {BoxGeometry, Mesh, MeshBasicMaterial, Scene} from 'three';
import {MapControls} from 'three/examples/jsm/controls/MapControls';
import RendererHelper from '@/core/helpers/RendererHelper';
import PerspectiveCameraHelper from '@/core/helpers/PerspectiveCameraHelper';

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
      屏幕方向平移
      <el-switch v-model="screenSpacePanning"></el-switch>
    </div>
    <div>
      缩放至鼠标所在位置
      <el-switch v-model="zoomToCursor"></el-switch>
    </div>
  </div>
</template>

<style scoped>

</style>

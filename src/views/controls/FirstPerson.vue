<script setup lang="ts">
import {onMounted, onUnmounted, ref, type Ref, shallowRef, watch} from 'vue';
import {BoxGeometry, Mesh, MeshBasicMaterial, Scene} from 'three';
import FirstPersonControl from '@/core/FirstPersonControl';
import RendererHelper from '@/core/helpers/RendererHelper';
import PerspectiveCameraHelper from '@/core/helpers/PerspectiveCameraHelper';

const el = shallowRef() as Ref<HTMLDivElement>;
let rendererHelper: RendererHelper;
let perspectiveCameraHelper: PerspectiveCameraHelper;
const movementSpeed = ref(0.1);
const lookSpeed = ref(0.002);
const started = ref(false);
let control: FirstPersonControl;

watch(movementSpeed, value => {
  control.movementSpeed = value;
});

watch(lookSpeed, value => {
  control.lookSpeed = value;
});

onMounted(() => {
  rendererHelper = new RendererHelper(el.value);
  const renderer = rendererHelper.renderer;
  perspectiveCameraHelper = new PerspectiveCameraHelper(renderer.domElement);
  const camera = perspectiveCameraHelper.camera;
  camera.position.set(0, 0, 4);

  const scene = new Scene();
  const geometry = new BoxGeometry(1, 1, 1);
  const material = new MeshBasicMaterial({color: 0xff0000});
  const cube = new Mesh(geometry, material);
  scene.add(cube);

  control = new FirstPersonControl(camera, renderer.domElement);
  control.addEventListener('lock', () => {
    started.value = true;
  });
  control.addEventListener('unlock', () => {
    started.value = false;
  });
  control.movementSpeed = movementSpeed.value;
  control.lookSpeed = lookSpeed.value;

  function animate() {
    control.update();
    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(animate);
});

function start() {
  control.lock();
}

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
      <el-button @click="start">开始</el-button>
      <span>{{ started ? '已开始' : '已结束' }}</span>第一人称视角
    </div>
    <div>
      移动速度
      <el-input-number v-model="movementSpeed" :step="0.1"></el-input-number>
    </div>
    <div>
      转头速度
      <el-input-number v-model="lookSpeed" :step="0.001"></el-input-number>
    </div>
  </div>
</template>

<style scoped>

</style>

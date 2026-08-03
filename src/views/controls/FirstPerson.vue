<script setup lang="ts">
import {onMounted, onUnmounted, ref, type Ref, shallowRef, watch} from 'vue';
import {BoxGeometry, Mesh, MeshBasicMaterial, Scene} from 'three';
import FirstPersonControl from '../../core/FirstPersonControl';
import RendererHelper from '../../core/helpers/RendererHelper';
import PerspectiveCameraHelper from '../../core/helpers/PerspectiveCameraHelper';

const el = shallowRef() as Ref<HTMLDivElement>;
let rendererHelper: RendererHelper;
let perspectiveCameraHelper: PerspectiveCameraHelper;
const movementSpeed = ref(2);
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
  const frameRender = () => {
    rendererHelper.needUpdate();
  };
  rendererHelper.addEventListener('changed', frameRender);
  const renderer = rendererHelper.renderer;
  perspectiveCameraHelper = new PerspectiveCameraHelper(renderer.domElement);
  perspectiveCameraHelper.addEventListener('changed', frameRender);
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
  control.addEventListener('changed', frameRender);
  control.movementSpeed = movementSpeed.value;
  control.lookSpeed = lookSpeed.value;

  rendererHelper.startLoop(scene, camera, () => {
    // loopFun执行之前，已经执行this.timer.update(time)，这里直接getDelta()取结果即可
    // 如果有任何移动，那么将会触发changed事件，从而执行rendererHelper.needUpdate()
    const delta = rendererHelper.timer.getDelta();
    control.update(delta);
  });
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
  <div class="h-full relative">
    <div class="h-full" ref="el">
    </div>
    <div class="rounded-lg space-y-2 p-2 absolute left-2 top-2 bg-default">
      <div class="flex justify-between px-2">
        <UButton @click="start">开始</UButton>
        <div><span>{{ started ? '已开始' : '已结束' }}</span>第一人称视角</div>
      </div>
      <div>
        移动速度
        <UInputNumber v-model="movementSpeed" :step="0.5"></UInputNumber>
      </div>
      <div>
        转头速度
        <UInputNumber v-model="lookSpeed" :step="0.001"></UInputNumber>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>


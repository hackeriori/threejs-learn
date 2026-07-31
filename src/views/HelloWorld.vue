<script setup lang="ts">
import {onMounted, onUnmounted, ref, type Ref, shallowRef, watch} from 'vue';
import {BoxGeometry, DirectionalLight, Mesh, MeshStandardMaterial, Scene} from 'three';
import RendererHelper from '../core/helpers/RendererHelper';
import PerspectiveCameraHelper from '../core/helpers/PerspectiveCameraHelper';

const el = shallowRef() as Ref<HTMLDivElement>;
let rendererHelper: RendererHelper;
let perspectiveCameraHelper: PerspectiveCameraHelper;
const rotateX = ref(true);
const rotateY = ref(true);
const rotateZ = ref(false);

watch([rotateX, rotateY, rotateZ], () => {
  rendererHelper?.needUpdate();
});

onMounted(() => {
  rendererHelper = new RendererHelper(el.value);
  const frameRender = () => {
    rendererHelper.needUpdate();
  };
  const renderer = rendererHelper.renderer;
  perspectiveCameraHelper = new PerspectiveCameraHelper(renderer.domElement);
  perspectiveCameraHelper.addEventListener('changed', frameRender);
  const camera = perspectiveCameraHelper.camera;
  camera.position.set(0, 0, 4);

  const scene = new Scene();
  const geometry = new BoxGeometry(1, 1, 1);
  const material = new MeshStandardMaterial({color: 0xff0000});
  const cube = new Mesh(geometry, material);
  // onBeforeRender在renderer.render(scene, camera)时执行，并调用 needUpdate() 再次预约下一帧，实现按需渲染
  cube.onBeforeRender = () => {
    if (rotateX.value)
      cube.rotation.x += 0.005;
    if (rotateY.value)
      cube.rotation.y += 0.005;
    if (rotateZ.value)
      cube.rotation.z += 0.005;
    if (rotateX.value || rotateY.value || rotateZ.value)
      rendererHelper.needUpdate();
  };
  scene.add(cube);
  const light = new DirectionalLight();
  light.position.set(-2, 2, 4);
  scene.add(light);

  rendererHelper.startLoop(scene, camera);
});

onUnmounted(() => {
  rendererHelper.dispose();
  perspectiveCameraHelper.dispose();
});
</script>

<template>
  <div class="h-full relative">
    <div class="h-full" ref="el">
    </div>
    <div class="rounded-lg w-xs space-y-2 p-2 absolute left-2 top-2 bg-default">
      <USwitch label="绕X轴旋转" v-model="rotateX"></USwitch>
      <USwitch label="绕Y轴旋转" v-model="rotateY"></USwitch>
      <USwitch label="绕Z轴旋转" v-model="rotateZ"></USwitch>
      <div class="space-y-2">
        <div class="text-lg text-highlighted">右手定则 (Right-Hand Rule)</div>
        <div>右手定则是 Three.js 判断旋转正负方向的唯一标准。当你给 rotation.x、rotation.y 或 rotation.z
          设置一个正值时，物体会遵循以下逻辑转动：
        </div>
        <div>1. 伸出你的右手，握成拳头。</div>
        <div>2. 大拇指竖起，指向你想要旋转的那个轴的正方向。</div>
        <div>3. 其余四指弯曲的方向，就是该轴“正向旋转”的方向。</div>
      </div>
    </div>
  </div>
</template>

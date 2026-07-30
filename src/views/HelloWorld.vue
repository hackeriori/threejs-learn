<script setup lang="ts">
import {onMounted, onUnmounted, ref, type Ref, shallowRef} from 'vue';
import {BoxGeometry, DirectionalLight, Mesh, MeshStandardMaterial, Scene} from 'three';
import RendererHelper from '../core/helpers/RendererHelper';
import PerspectiveCameraHelper from '../core/helpers/PerspectiveCameraHelper';

const el = shallowRef() as Ref<HTMLDivElement>;
let rendererHelper: RendererHelper;
let perspectiveCameraHelper: PerspectiveCameraHelper;
const rotateX = ref(true);
const rotateY = ref(true);
const rotateZ = ref(false);

onMounted(() => {
  rendererHelper = new RendererHelper(el.value);
  const renderer = rendererHelper.renderer;
  perspectiveCameraHelper = new PerspectiveCameraHelper(renderer.domElement);
  const camera = perspectiveCameraHelper.camera;
  camera.position.set(0, 0, 4);

  const scene = new Scene();
  const geometry = new BoxGeometry(1, 1, 1);
  const material = new MeshStandardMaterial({color: 0xff0000});
  const cube = new Mesh(geometry, material);
  scene.add(cube);
  const light = new DirectionalLight();
  light.position.set(-2, 2, 4);
  scene.add(light);

  function animate() {
    if (rotateX.value)
      cube.rotation.x += 0.005;
    if (rotateY.value)
      cube.rotation.y += 0.005;
    if (rotateZ.value)
      cube.rotation.z += 0.005;
    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(animate);
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
    <div class="rounded-lg space-y-2 p-2 absolute left-2 top-2 bg-default">
      <div>
        <USwitch label="绕X轴旋转" v-model="rotateX"></USwitch>
      </div>
      <div>
        <USwitch label="绕Y轴旋转" v-model="rotateY"></USwitch>
      </div>
      <div>
        <USwitch label="绕Z轴旋转" v-model="rotateZ"></USwitch>
      </div>
    </div>
  </div>
</template>

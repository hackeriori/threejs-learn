<script setup lang="ts">
import {onMounted, onUnmounted, type Ref, shallowRef} from 'vue';
import {BoxGeometry, DirectionalLight, Mesh, MeshStandardMaterial, Scene} from 'three';
import {MapControls} from 'three/examples/jsm/controls/MapControls';
import RendererHelper from '@/core/helpers/RendererHelper';
import PerspectiveCameraHelper from '@/core/helpers/PerspectiveCameraHelper';

const el = shallowRef() as Ref<HTMLDivElement>;
let rendererHelper: RendererHelper;
let perspectiveCameraHelper: PerspectiveCameraHelper;
let control: MapControls;

onMounted(() => {
  rendererHelper = new RendererHelper(el.value);
  const frameRender = () => {
    rendererHelper.needUpdate();
  };
  const renderer = rendererHelper.renderer;
  perspectiveCameraHelper = new PerspectiveCameraHelper(renderer.domElement);
  perspectiveCameraHelper.addEventListener('changed', frameRender);
  const camera = perspectiveCameraHelper.camera;
  camera.position.set(4, 4, 4);

  const scene = new Scene();
  const boxGeometry = new BoxGeometry();
  const meshStandardMaterial = new MeshStandardMaterial({color: 0xff0000});
  const mesh = new Mesh(boxGeometry, meshStandardMaterial);
  const directionalLight = new DirectionalLight();
  directionalLight.position.set(-100, 100, 100);
  scene.add(mesh);
  scene.add(directionalLight);

  control = new MapControls(camera, renderer.domElement);
  control.zoomToCursor = true;
  control.update();
  control.addEventListener('change', frameRender);

  rendererHelper.startLoop(scene, camera);
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
    <div style="width: 300px">
      观察浏览器帧渲染统计器或者任务管理器的GPU使用率，可以发现按需渲染在保持禁止不动时，不会渲染帧，几乎不占用GPU。仅当发生交互时，才进行渲染。这对于移动设备（使用电池的场景）来说，更为友好和省电。
    </div>
    <div style="width: 300px">
      但是这样渲染有个问题，在每帧驱动的动画中，如果把每帧动画写在startLoop的回调中，即使该元素不可见，仍然在逐帧渲染，这样就失去了动态渲染的意义。可以参考<router-link to="/ImageTexture">图片纹理</router-link>的方式来处理，这样即保持了动画的需求，又可以在元素不可见时不渲染，而且不需要渲染前计算视锥关系
    </div>
  </div>
</template>

<style scoped>

</style>

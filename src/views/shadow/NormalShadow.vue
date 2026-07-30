<script setup lang="ts">
import {onMounted, onUnmounted, type Ref, shallowRef} from 'vue';
import {BoxGeometry, DirectionalLight, Mesh, MeshStandardMaterial, PlaneGeometry, Scene} from 'three';
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
  // 打开渲染器的阴影开关
  renderer.shadowMap.enabled = true;
  perspectiveCameraHelper = new PerspectiveCameraHelper(renderer.domElement);
  perspectiveCameraHelper.addEventListener('changed', frameRender);
  const camera = perspectiveCameraHelper.camera;
  camera.position.set(4, 4, 4);

  const scene = new Scene();
  const boxGeometry = new BoxGeometry();
  const meshStandardMaterial = new MeshStandardMaterial({color: 0xff0000});
  const mesh = new Mesh(boxGeometry, meshStandardMaterial);
  mesh.position.set(0, 1, 0);
  // 立方体产生阴影
  mesh.castShadow = true;
  rendererHelper.addDynamicObject(mesh);
  mesh.onBeforeRender = () => {
    mesh.rotation.x += 0.005;
    mesh.rotation.y += 0.005;
    // 这里指定下一帧需要渲染，避免下一帧重新计算矩阵
    rendererHelper.needUpdate();
  };
  const directionalLight = new DirectionalLight();
  // 灯光产生阴影
  directionalLight.castShadow = true;
  directionalLight.position.set(-100, 100, 100);
  scene.add(mesh);
  scene.add(directionalLight);
  // 添加观察平面
  const planeGeometry = new PlaneGeometry(40, 40);
  const planeMesh = new Mesh(planeGeometry, new MeshStandardMaterial({color: 0x444444}));
  // 平面接受阴影
  planeMesh.receiveShadow = true;
  planeMesh.rotation.x = Math.PI * -.5;
  scene.add(planeMesh);

  control = new MapControls(camera, renderer.domElement);
  control.zoomToCursor = true;
  control.update();
  control.addEventListener('change', frameRender);

  rendererHelper.startLoop(scene, camera, (time) => {
    const speed = time * 0.001;
    const radius = 5;
    mesh.position.x = Math.sin(speed) * radius;
  });
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
      添加阴影，需要打开渲染器的允许阴影，renderer.shadowMap.enabled = true;
    </div>
    <div style="width: 300px">
      灯光和物体发出阴影，castShadow = true;
    </div>
    <div style="width: 300px">
      平面接收阴影，receiveShadow = true
    </div>
    <div style="width: 300px">
      产生阴影是非常昂贵的计算，有多少产生阴影的灯光，整个场景就会渲染多少次。优化方案可以只让其中一个灯光产生阴影，或者使用光照贴图或者环境光贴图，预先计算离线照明的效果，或者使用假阴影。
    </div>
  </div>
</template>

<style scoped>

</style>

<script setup lang="ts">
import {onMounted, onUnmounted, ref, type Ref, shallowRef} from 'vue';
import {Mesh, MeshBasicMaterial, Scene, SphereGeometry, AxesHelper} from 'three';
import {MapControls} from 'three/examples/jsm/controls/MapControls';
import RendererHelper from '@/core/helpers/RendererHelper';
import PerspectiveCameraHelper from '@/core/helpers/PerspectiveCameraHelper';

const el = shallowRef() as Ref<HTMLDivElement>;
let rendererHelper: RendererHelper;
let perspectiveCameraHelper: PerspectiveCameraHelper;
let control: MapControls;
const routeRed = ref(true);
const routeBlue = ref(true);

onMounted(() => {
  rendererHelper = new RendererHelper(el.value);
  const renderer = rendererHelper.renderer;
  perspectiveCameraHelper = new PerspectiveCameraHelper(renderer.domElement);
  const camera = perspectiveCameraHelper.camera;
  camera.position.set(0, 10, 0);

  const scene = new Scene();
  const geometry = new SphereGeometry(1);
  const materialRed = new MeshBasicMaterial({color: 0xff0000});
  const materialBlue = new MeshBasicMaterial({color: 0x0000ff});
  const father = new Mesh(geometry, materialRed);
  // position是局部坐标,但是由于father被添加到场景，场景的原点是0，0，0，所以相当于是世界坐标
  father.position.set(5, 0, 0);
  const child = new Mesh(geometry, materialBlue);
  father.add(child);
  // 子元素由于被添加到父元素，所以这里position相对于father
  child.position.set(0, 0, 3);

  const axesHelper = new AxesHelper(10);
  scene.add(father);
  scene.add(axesHelper);

  control = new MapControls(camera, renderer.domElement);
  control.zoomToCursor = true;

  function animate(time: DOMHighResTimeStamp) {
    const speed = time * 0.0005;
    const radiusRed = 5;
    const radiusBlue = 3;
    if (routeRed.value) {
      father.position.z = Math.cos(speed) * radiusRed;
      father.position.x = Math.sin(speed) * radiusRed;
    }
    if (routeBlue.value) {
      child.position.y = Math.cos(speed) * radiusBlue;
      child.position.z = Math.sin(speed) * radiusBlue;
    }
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
      红色小球旋转
      <el-switch v-model="routeRed"></el-switch>
    </div>
    <div>
      蓝色小球旋转
      <el-switch v-model="routeBlue"></el-switch>
    </div>
  </div>
</template>

<style scoped>

</style>

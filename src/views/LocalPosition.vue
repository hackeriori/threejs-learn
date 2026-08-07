<script setup lang="ts">
import {onMounted, onUnmounted, ref, type Ref, shallowRef, watch} from 'vue';
import {Mesh, MeshBasicMaterial, Scene, SphereGeometry, AxesHelper} from 'three';
import {MapControls} from 'three/examples/jsm/controls/MapControls.js';
import RendererHelper from '../core/helpers/RendererHelper';
import PerspectiveCameraHelper from '../core/helpers/PerspectiveCameraHelper';
import {RenderMonitor} from '../core/RenderMonitor.ts';

const el = shallowRef() as Ref<HTMLDivElement>;
let rendererHelper: RendererHelper;
let perspectiveCameraHelper: PerspectiveCameraHelper;
let control: MapControls;
const routeRed = ref(true);
const routeBlue = ref(true);

onMounted(() => {
  rendererHelper = new RendererHelper(el.value);
  const renderer = rendererHelper.renderer;
  new RenderMonitor(renderer);
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

  // 两个小球在离开视野时停止渲染，如果不需要，可以注释掉下面两行，然后在startLoop的开关分支中手动添加rendererHelper.needUpdate()，这样无论小球是否在视野内，只要打开了开关都逐帧渲染。
  rendererHelper.addDynamicObject(father);
  rendererHelper.addDynamicObject(child);

  // 根据旋转开关状态动态添加/移除动态物体集
  watch([routeRed, routeBlue], () => {
    rendererHelper.needUpdate();
  });

  control = new MapControls(camera, renderer.domElement);
  control.zoomToCursor = true;
  control.addEventListener('change', ()=>{
    rendererHelper.needUpdate();
  });

  let angleRed = 0;
  let angleBlue = 0;

  rendererHelper.startLoop(scene, camera, () => {
    // 使用 timer.getDelta() 获取增量时间（秒）
    const delta = rendererHelper.timer.getDelta();
    const speedScale = 0.5; // 角速度 (rad/s)
    const radiusRed = 5;
    const radiusBlue = 3;
    if (routeRed.value) {
      angleRed += delta * speedScale;
      father.position.z = Math.cos(angleRed) * radiusRed;
      father.position.x = Math.sin(angleRed) * radiusRed;
    }
    if (routeBlue.value) {
      angleBlue += delta * speedScale;
      child.position.y = Math.cos(angleBlue) * radiusBlue;
      child.position.z = Math.sin(angleBlue) * radiusBlue;
    }
    control.update();
  });
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
    <div class="rounded-lg w-xs space-y-2 p-2 absolute left-2 top-2 bg-default">
      <div>
        <USwitch label="红色小球旋转" v-model="routeRed"></USwitch>
      </div>
      <div>
        <USwitch label="蓝色小球旋转" v-model="routeBlue"></USwitch>
      </div>
      <div>
        红色小球是父元素，它的 position 是相对于场景中心（世界坐标系原点 (0,0,0)）的。蓝色小球 被添加到了 红色小球 坐标系中，它的 position 就变成了相对于 father 的局部坐标（Local Space）。类似“太阳-地球”或“地球-月球”的模型：红色小球（father）绕着场景中心公转。蓝色小球（child）绕着红色小球公转。当关闭蓝色旋转，只开启红色旋转时，蓝色小球依然会在空间中移动，因为它会继承父物体 father 的世界位移。
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>

<script setup lang="ts">
import {onMounted, onUnmounted, ref, type Ref, shallowRef, watch} from 'vue';
import {
  BoxGeometry, CameraHelper, DirectionalLight, Mesh, MeshStandardMaterial, type PerspectiveCamera, PlaneGeometry, Scene
} from 'three';
import {MapControls} from 'three/examples/jsm/controls/MapControls';
import RendererHelper from '@/core/helpers/RendererHelper';
import PerspectiveCameraHelper from '@/core/helpers/PerspectiveCameraHelper';
import {appScissorForRender, getObjectUserData, getScissorForElement} from '@/core/shared';

interface CustomUserDataType {
  unRendered: boolean
}

const el = shallowRef() as Ref<HTMLDivElement>;
const el1 = shallowRef() as Ref<HTMLDivElement>;
const el2 = shallowRef() as Ref<HTMLDivElement>;
let rendererHelper: RendererHelper;
let perspectiveCameraHelper1: PerspectiveCameraHelper;
let perspectiveCameraHelper2: PerspectiveCameraHelper;
let control1: MapControls;
let control2: MapControls;
let camera1: PerspectiveCamera;
let cameraHelper: CameraHelper;
const fov = ref(50);
const near = ref(0.1);
// 被观察相机使用较短的远端面，方便在el2中观察
const far = ref(30);

watch([fov, near, far], ([fov, near, far]) => {
  camera1.fov = fov;
  camera1.near = near;
  camera1.far = far;
  camera1.updateProjectionMatrix();
  cameraHelper.update();
});

onMounted(() => {
  rendererHelper = new RendererHelper(el.value);
  const frameRender = () => {
    rendererHelper.needUpdate();
  };
  rendererHelper.addEventListener('changed', () => {
    // 在canvas尺寸变化后更新剪刀参数
    scissor1 = getScissorForElement(el1.value);
    scissor2 = getScissorForElement(el2.value);
  });
  const renderer = rendererHelper.renderer;
  renderer.setScissorTest(true);
  perspectiveCameraHelper1 = new PerspectiveCameraHelper(el1.value, fov.value, undefined, near.value, far.value);
  perspectiveCameraHelper1.addEventListener('changed', frameRender);
  camera1 = perspectiveCameraHelper1.camera;
  camera1.position.set(4, 4, 4);
  // 添加第二台相机
  perspectiveCameraHelper2 = new PerspectiveCameraHelper(el2.value);
  perspectiveCameraHelper2.addEventListener('changed', frameRender);
  const camera2 = perspectiveCameraHelper2.camera;
  camera2.position.set(-50, 50, 50);
  let scissor1 = getScissorForElement(el1.value);
  let scissor2 = getScissorForElement(el2.value);

  const scene = new Scene();
  const boxGeometry = new BoxGeometry();
  const meshStandardMaterial = new MeshStandardMaterial({color: 0xff0000});
  const mesh = new Mesh(boxGeometry, meshStandardMaterial);
  mesh.position.set(0, 1, 0);
  mesh.onBeforeRender = () => {
    const userData = getObjectUserData<CustomUserDataType>(mesh);
    // 注意这里是双相机，所以每帧这个回调会执行两次。所以需要一个变量来限制它只执行一次;
    if (userData.unRendered) {
      userData.unRendered = false;
      mesh.rotation.x += 0.005;
      mesh.rotation.y += 0.005;
      rendererHelper.needUpdate();
    }
  };
  const directionalLight = new DirectionalLight();
  directionalLight.position.set(-100, 100, 100);
  scene.add(mesh);
  scene.add(directionalLight);
  cameraHelper = new CameraHelper(camera1);
  scene.add(cameraHelper);
  // 添加观察平面
  const planeGeometry = new PlaneGeometry(40, 40);
  const planeMesh = new Mesh(planeGeometry, new MeshStandardMaterial({color: 0x444444}));
  planeMesh.rotation.x = Math.PI * -.5;
  scene.add(planeMesh);

  // 注意这里没有使用renderer.domElement，使用了左边部分的div，控制只针对左边部分有效
  control1 = new MapControls(camera1, el1.value);
  control1.update();
  control1.addEventListener('change', frameRender);
  control2 = new MapControls(camera2, el2.value);
  control2.update();
  control2.addEventListener('change', frameRender);

  rendererHelper.startLoop(scene, camera1, undefined, () => {
    // 经过测试，一帧中的左右视野不能按需渲染，否则未渲染的视野不能继续保持上一帧的内容，呈现空白。
    // 重置物体需要渲染
    getObjectUserData<CustomUserDataType>(mesh).unRendered = true;
    // 渲染左视野
    appScissorForRender(renderer, scissor1);
    // 在左边视野中不渲染cameraHelper
    cameraHelper.visible = false;
    renderer.render(scene, camera1);
    // 渲染右视野
    appScissorForRender(renderer, scissor2);
    cameraHelper.visible = true;
    renderer.render(scene, camera2);
  });
});
onUnmounted(() => {
  rendererHelper.dispose();
  perspectiveCameraHelper1.dispose();
  perspectiveCameraHelper2.dispose();
  control1.dispose();
  control2.dispose();
});
</script>

<template>
  <div class="height100 ls-abs-outer">
    <div class="height100" ref="el">
      <div class="split">
        <div ref="el1"></div>
        <div ref="el2"></div>
      </div>
    </div>
  </div>
  <div class="controlBox">
    <div>
      视锥体垂直视野角度
      <el-input-number v-model="fov"></el-input-number>
    </div>
    <div>
      近端面
      <el-input-number v-model="near"></el-input-number>
    </div>
    <div>
      远端面
      <el-input-number v-model="far"></el-input-number>
    </div>
  </div>
</template>

<style scoped>
.split {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
}

.split > div {
  width: 50%;
  height: 100%;
}
</style>

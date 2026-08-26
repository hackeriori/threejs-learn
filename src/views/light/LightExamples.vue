<script setup lang="ts">
import {onMounted, onUnmounted, ref, type Ref, shallowRef, watch} from 'vue';
import {
  BoxGeometry, DirectionalLight, DirectionalLightHelper, type Light, MathUtils, Mesh, MeshStandardMaterial,
  NearestFilter, type Object3D, PlaneGeometry, PointLight, PointLightHelper, RectAreaLight, Scene, SpotLight,
  SpotLightHelper, type Texture, TextureLoader
} from 'three';
import {MapControls} from 'three/examples/jsm/controls/MapControls.js';
import RendererHelper from '../../core/helpers/RendererHelper';
import PerspectiveCameraHelper from '../../core/helpers/PerspectiveCameraHelper';
import {RepeatWrapping} from 'three/src/constants.js';
import {RectAreaLightHelper} from 'three/examples/jsm/helpers/RectAreaLightHelper.js';
import {RenderMonitor} from '../../core/RenderMonitor.ts';

const el = shallowRef() as Ref<HTMLDivElement>;
let rendererHelper: RendererHelper;
let perspectiveCameraHelper: PerspectiveCameraHelper;
let control: MapControls;
let texture: Texture;
let directionalLight: DirectionalLight;
let directionalLightHelper: DirectionalLightHelper;
let pointLight: PointLight;
let pointLightHelper: PointLightHelper;
let spotLight: SpotLight;
let spotLightHelper: SpotLightHelper;
let rectAreaLight: RectAreaLight;
let rectAreaLightHelper: RectAreaLightHelper;
let scene: Scene;
let light: Light;
let lightHelper: Object3D;
const currentLight = ref(1);
const x = ref(-3);
const y = ref(3);
const z = ref(3);
const intensity = ref(1);
const distance = ref(0);
const angle = ref(60);

watch([x, y, z], ([x, y, z]) => {
  light.position.set(x, y, z);
  (lightHelper as any).update?.();
});
watch(intensity, value => {
  light.intensity = value;
});
watch(distance, value => {
  (light as any).distance = value;
});
watch(angle, value => {
  (light as any).angle = MathUtils.degToRad(value);
  (lightHelper as any).update?.();
});
watch(currentLight, value => {
  scene.remove(light);
  scene.remove(lightHelper);
  if (value === 1) {
    light = directionalLight;
    lightHelper = directionalLightHelper;
  } else if (value === 2) {
    light = pointLight;
    lightHelper = pointLightHelper;
  } else if (value === 3) {
    light = spotLight;
    lightHelper = spotLightHelper;
  } else if (value === 4) {
    light = rectAreaLight;
    lightHelper = rectAreaLightHelper;
  }
  light.position.set(x.value, y.value, z.value);
  light.intensity = intensity.value;
  if ('distance' in light)
    light.distance = distance.value;
  if ('angle' in light)
    light.angle = MathUtils.degToRad(angle.value);
  (lightHelper as any).update?.();
  scene.add(light);
  scene.add(lightHelper);
});

onMounted(async () => {
  rendererHelper = new RendererHelper(el.value);
  const renderer = rendererHelper.renderer;
  new RenderMonitor(renderer);
  perspectiveCameraHelper = new PerspectiveCameraHelper(renderer.domElement);
  const camera = perspectiveCameraHelper.camera;
  camera.position.set(6, 6, 6);

  scene = new Scene();
  const loader = new TextureLoader();
  loader.setPath('resources/images/');
  texture = await loader.loadAsync('flower-4.jpg');
  texture.colorSpace = 'srgb';
  const boxGeometry = new BoxGeometry();
  const meshStandardMaterial = new MeshStandardMaterial({map: texture});
  const mesh = new Mesh(boxGeometry, meshStandardMaterial);
  mesh.position.set(0, 1, 0);
  mesh.onBeforeRender = () => {
    mesh.rotation.x += 0.005;
    mesh.rotation.y += 0.005;
    rendererHelper.needUpdate();
  };
  directionalLight = new DirectionalLight();
  directionalLight.position.set(x.value, y.value, z.value);
  directionalLightHelper = new DirectionalLightHelper(directionalLight);
  light = directionalLight;
  lightHelper = directionalLightHelper;
  pointLight = new PointLight();
  pointLight.position.set(x.value, y.value, z.value);
  pointLightHelper = new PointLightHelper(pointLight);
  spotLight = new SpotLight();
  spotLight.position.set(x.value, y.value, z.value);
  spotLightHelper = new SpotLightHelper(spotLight);
  rectAreaLight = new RectAreaLight();
  rectAreaLight.position.set(x.value, y.value, z.value);
  rectAreaLightHelper = new RectAreaLightHelper(rectAreaLight);
  scene.add(mesh);
  scene.add(directionalLight);
  const planeGeometry = new PlaneGeometry(40, 40);
  const planeTexture = await loader.loadAsync('checker.png');
  planeTexture.colorSpace = 'srgb';
  planeTexture.wrapS = RepeatWrapping;
  planeTexture.wrapT = RepeatWrapping;
  planeTexture.magFilter = NearestFilter;
  planeTexture.repeat.set(20, 20);
  const planeMesh = new Mesh(planeGeometry, new MeshStandardMaterial({map: planeTexture}));
  planeMesh.rotation.x = Math.PI * -.5;
  scene.add(planeMesh);
  scene.add(directionalLightHelper);

  control = new MapControls(camera, renderer.domElement);
  control.zoomToCursor = true;
  control.update();
  control.addEventListener('change', () => {
    rendererHelper.needUpdate();
  });

  rendererHelper.startLoop(scene, camera);
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
  </div>
  <div class="rounded-lg w-sm space-y-2 p-2 absolute left-2 top-2 bg-default">
    <div>
      当前灯光类型
      <URadioGroup v-model="currentLight" :items="[
        {value: 1, label: '平行光'},
        {value: 2, label: '点光源'},
        {value: 3, label: '聚光灯'},
        {value: 4, label: '矩形区域光'}
      ]">
      </URadioGroup>
    </div>
    <div>
      光照强度
      <UInputNumber v-model="intensity"></UInputNumber>
    </div>
    <div v-if="currentLight > 1 && currentLight < 4">
      光照距离
      <UInputNumber v-model="distance"></UInputNumber>
    </div>
    <div v-if="currentLight === 3">
      光照范围角度
      <UInputNumber v-model="angle" :max="90" :min="0"></UInputNumber>
    </div>
    <div>
      x
      <UInputNumber v-model="x"></UInputNumber>
    </div>
    <div>
      y
      <UInputNumber v-model="y"></UInputNumber>
    </div>
    <div>
      z
      <UInputNumber v-model="z"></UInputNumber>
    </div>
    <div v-if="currentLight === 3">可以调节penumbra来控制光源的边缘硬度</div>
    <div v-if="currentLight === 4">
      这种光源可以用来模拟像明亮的窗户或者条状灯光光源，通过调节自身的旋转和宽高来更改光源
    </div>
  </div>
</template>

<style scoped>

</style>

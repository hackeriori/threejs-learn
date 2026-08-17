<script setup lang="ts">
import {onMounted, onUnmounted, ref, type Ref, shallowRef, watch} from 'vue';
import {
  BoxGeometry, DirectionalLight, Mesh, MeshStandardMaterial, NearestFilter, PlaneGeometry, Scene, type Texture,
  TextureLoader
} from 'three';
import {MapControls} from 'three/examples/jsm/controls/MapControls.js';
import RendererHelper from '../../core/helpers/RendererHelper';
import PerspectiveCameraHelper from '../../core/helpers/PerspectiveCameraHelper';
import {ClampToEdgeWrapping, MirroredRepeatWrapping, RepeatWrapping, type Wrapping} from 'three/src/constants.js';
import {RenderMonitor} from '../../core/RenderMonitor.ts';

const el = shallowRef() as Ref<HTMLDivElement>;
let rendererHelper: RendererHelper;
let perspectiveCameraHelper: PerspectiveCameraHelper;
let control: MapControls;
let texture: Texture;
let frameRender: () => void;
const wrapS = ref<Wrapping>(ClampToEdgeWrapping);
const wrapT = ref<Wrapping>(ClampToEdgeWrapping);
const repeatX = ref(1);
const repeatY = ref(1);

watch(wrapS, value => {
  texture.wrapS = value;
  texture.needsUpdate = true;
  frameRender();
});
watch(wrapT, value => {
  texture.wrapT = value;
  texture.needsUpdate = true;
  frameRender();
});
watch([repeatX, repeatY], ([x, y]) => {
  texture.repeat.set(x, y);
  texture.needsUpdate = true;
  frameRender();
});

onMounted(async () => {
  rendererHelper = new RendererHelper(el.value);
  frameRender = () => {
    rendererHelper.needUpdate();
  };
  const renderer = rendererHelper.renderer;
  new RenderMonitor(renderer);
  perspectiveCameraHelper = new PerspectiveCameraHelper(renderer.domElement);
  const camera = perspectiveCameraHelper.camera;
  camera.position.set(4, 4, 4);

  const scene = new Scene();
  const loader = new TextureLoader();
  loader.setPath('resources/images/');
  texture = await loader.loadAsync('flower-4.jpg');
  texture.colorSpace = 'srgb';
  const boxGeometry = new BoxGeometry();
  const meshStandardMaterial = new MeshStandardMaterial({map: texture});
  const mesh = new Mesh(boxGeometry, meshStandardMaterial);
  mesh.position.set(0, 1, 0);
  // 注意这里的onBeforeRender，是在渲染该物体之前调用，并且是确认该帧需要渲染时才会调用
  // 所以在物体不可见visible为false或物体不在相机视锥体范围内时，都不会调用(frustumCulled设置为false除外)
  // 在该回调中，我们重置了下一帧需要渲染（该帧已渲染），所以该动画在物体可见时会持续下去，实现了动态渲染。
  // 但是注意，这个回调适用于静态物体（位置不发生变化的），物体旋转，颜色变化都适合写这里，但是动态物体，需要写入loop中，
  // 因为动态物体一旦离开视野，那么这个方法就不在执行，即使它再回到视野中，也无法渲染。
  mesh.onBeforeRender = () => {
    mesh.rotation.x += 0.005;
    mesh.rotation.y += 0.005;
    // 这里指定下一帧需要渲染，避免下一帧重新计算矩阵
    rendererHelper.needUpdate();
  };
  // 添加到动态物体集，以便不在视野中时后台计算位置
  rendererHelper.addDynamicObject(mesh);
  const directionalLight = new DirectionalLight();
  directionalLight.position.set(-100, 100, 100);
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

  control = new MapControls(camera, renderer.domElement);
  control.zoomToCursor = true;
  control.update();
  control.addEventListener('change', frameRender);

  let speed = 0;

  rendererHelper.startLoop(scene, camera, () => {
    // 使用 timer.getDelta() 获取增量时间（秒）
    const delta = rendererHelper.timer.getDelta();
    speed += delta;
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
  <div class="h-full relative">
    <div class="h-full" ref="el">
    </div>
  </div>
  <div class="rounded-lg w-xs space-y-2 p-2 absolute left-2 top-2 bg-default">
    <div>水平方向</div>
    <div>
      <URadioGroup v-model="wrapS" :items="[
        {label: '重复图案', value: RepeatWrapping},
        {label: '边缘像素', value: ClampToEdgeWrapping},
        {label: '镜像重复', value: MirroredRepeatWrapping}
      ]" orientation="horizontal">
      </URadioGroup>
    </div>
    <div>垂直方向</div>
    <div>
      <URadioGroup v-model="wrapT" :items="[
        {label: '重复图案', value: RepeatWrapping},
        {label: '边缘像素', value: ClampToEdgeWrapping},
        {label: '镜像重复', value: MirroredRepeatWrapping}
      ]" orientation="horizontal">
      </URadioGroup>
    </div>
    <div>水平方向划分</div>
    <div>
      <UInputNumber v-model="repeatX">
      </UInputNumber>
    </div>
    <div>垂直方向划分</div>
    <div>
      <UInputNumber v-model="repeatY">
      </UInputNumber>
    </div>
  </div>
</template>

<style scoped>

</style>

<script setup lang="ts">
import {onMounted, onUnmounted, ref, type Ref, shallowRef, watch} from 'vue';
import {BoxGeometry, Mesh, MeshBasicMaterial, Scene} from 'three';
import RendererHelper from '../core/helpers/RendererHelper';
import PerspectiveCameraHelper from '../core/helpers/PerspectiveCameraHelper';
import {RenderMonitor} from '../core/RenderMonitor.ts';

const MIN_POS = -10;
const MAX_POS = 10;

const el = shallowRef() as Ref<HTMLDivElement>;
let rendererHelper: RendererHelper;
let perspectiveCameraHelper: PerspectiveCameraHelper;
const x = ref(0);
const y = ref(0);
const z = ref(0);
let cube: Mesh;

watch([x, y, z], () => {
  // 设置物体的绝对坐标
  cube.position.set(x.value, y.value, z.value);
  rendererHelper?.needUpdate();
});

function moveCube(axis: 'X' | 'Y' | 'Z', number: 1 | -1) {
  // 以物体的当前坐标为原点，相对移动
  switch (axis) {
    case 'X':
      cube.translateX(number);
      break;
    case 'Y':
      cube.translateY(number);
      break;
    case 'Z':
      cube.translateZ(number);
      break;
  }
  // 限制物体坐标在 min/max 范围内
  cube.position.x = Math.min(MAX_POS, Math.max(MIN_POS, cube.position.x));
  cube.position.y = Math.min(MAX_POS, Math.max(MIN_POS, cube.position.y));
  cube.position.z = Math.min(MAX_POS, Math.max(MIN_POS, cube.position.z));
  // 设置后获取物体的绝对坐标，以在界面显示。
  x.value = cube.position.x;
  y.value = cube.position.y;
  z.value = cube.position.z;
}


onMounted(() => {
  rendererHelper = new RendererHelper(el.value);
  const renderer = rendererHelper.renderer;
  perspectiveCameraHelper = new PerspectiveCameraHelper(renderer.domElement);
  new RenderMonitor(renderer);
  const camera = perspectiveCameraHelper.camera;
  camera.position.set(0, 0, 10);

  const scene = new Scene();
  const geometry = new BoxGeometry(1, 1, 1);
  const material = new MeshBasicMaterial({color: 0xff0000});
  cube = new Mesh(geometry, material);
  scene.add(cube);

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
      <UForm class="space-y-2">
        <UFormField label="X轴">
          <UInputNumber :max="MAX_POS" :min="MIN_POS" v-model="x"></UInputNumber>
        </UFormField>
        <UFormField label="Y轴">
          <UInputNumber :max="MAX_POS" :min="MIN_POS" v-model="y"></UInputNumber>
        </UFormField>
        <UFormField label="Z轴">
          <UInputNumber :max="MAX_POS" :min="MIN_POS" v-model="z"></UInputNumber>
        </UFormField>
      </UForm>
      <div>移动物体</div>
      <div class="space-x-4">
        <UButton @click="moveCube('X',-1)">左移</UButton>
        <UButton @click="moveCube('X',1)">右移</UButton>
      </div>
      <div class="space-x-4">
        <UButton @click="moveCube('Y',1)">上移</UButton>
        <UButton @click="moveCube('Y',-1)">下移</UButton>
      </div>
      <div class="space-x-4">
        <UButton @click="moveCube('Z',1)">前移</UButton>
        <UButton @click="moveCube('Z',-1)">后移</UButton>
      </div>
      <div>左手手心朝向自己，伸直大拇指，食指，中指朝向自己。此时食指，大拇指，中指分别代表X,Y,Z，且他们都指向这几个轴的正值
      </div>
    </div>
  </div>
</template>

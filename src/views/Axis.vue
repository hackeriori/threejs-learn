<script setup lang="ts">
import {onMounted, onUnmounted, ref, type Ref, shallowRef, watch} from 'vue';
import {BoxGeometry, Mesh, MeshBasicMaterial, Scene} from 'three';
import RendererHelper from '@/core/helpers/RendererHelper';
import PerspectiveCameraHelper from '@/core/helpers/PerspectiveCameraHelper';

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
});

function moveCube(axis: 'X' | 'Y' | 'Z', number: 1 | -1) {
  // 以物体的当前坐标为原点，相对移动
  cube['translate' + axis](number);
  // 设置后获取物体的绝对坐标，以在界面显示。
  x.value = cube.position.x;
  y.value = cube.position.y;
  z.value = cube.position.z;
}


onMounted(() => {
  rendererHelper = new RendererHelper(el.value);
  const renderer = rendererHelper.renderer;
  perspectiveCameraHelper = new PerspectiveCameraHelper(renderer.domElement);
  const camera = perspectiveCameraHelper.camera;
  camera.position.set(0, 0, 10);

  const scene = new Scene();
  const geometry = new BoxGeometry(1, 1, 1);
  const material = new MeshBasicMaterial({color: 0xff0000});
  cube = new Mesh(geometry, material);
  scene.add(cube);

  function animate() {
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
  <div class="height100 ls-abs-outer">
    <div class="height100" ref="el">
    </div>
  </div>
  <div class="controlBox">
    <div>
      X轴
      <el-input-number :max="10" :min="-10" v-model="x"></el-input-number>
    </div>
    <div>
      Y轴
      <el-input-number :max="10" :min="-10" v-model="y"></el-input-number>
    </div>
    <div>
      Z轴
      <el-input-number :max="10" :min="-10" v-model="z"></el-input-number>
    </div>
    <div>移动物体</div>
    <div>
      <el-button @click="moveCube('X',-1)">左移</el-button>
      <el-button @click="moveCube('X',1)">右移</el-button>
    </div>
    <div>
      <el-button @click="moveCube('Y',1)">上移</el-button>
      <el-button @click="moveCube('Y',-1)">下移</el-button>
    </div>
    <div>
      <el-button @click="moveCube('Z',1)">前移</el-button>
      <el-button @click="moveCube('Z',-1)">后移</el-button>
    </div>
    <div>左手手心朝向自己，伸直大拇指，食指，中指朝向自己。此时食指，大拇指，中指分别代表X,Y,Z，且他们都指向这几个轴的正值
    </div>
  </div>
</template>

<style scoped>
.controlBox {
  width: 160px
}
</style>

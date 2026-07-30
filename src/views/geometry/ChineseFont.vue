<script setup lang="ts">
import {onMounted, onUnmounted, reactive, type Ref, shallowRef, toRaw, watch} from 'vue';
import {putMeshToItsCenter} from '@/core/shared';
import {DirectionalLight, Mesh, MeshPhysicalMaterial, Object3D, Scene} from 'three';
import {MapControls} from 'three/examples/jsm/controls/MapControls';
import {TextGeometry, type TextGeometryParameters} from 'three/examples/jsm/geometries/TextGeometry';
import {FontLoader} from 'three/examples/jsm/loaders/FontLoader';
import {simpleFont} from './fontData';
import RendererHelper from '@/core/helpers/RendererHelper';
import PerspectiveCameraHelper from '@/core/helpers/PerspectiveCameraHelper';

const el = shallowRef() as Ref<HTMLDivElement>;
let rendererHelper: RendererHelper;
let perspectiveCameraHelper: PerspectiveCameraHelper;
let control: MapControls;
let geometry: TextGeometry;
let cube: Mesh;
let parent: Object3D;
const font = new FontLoader().parse(simpleFont);
const fontOptions = reactive<TextGeometryParameters>({
  font,
  size: 1,
  depth: 0.2,
  curveSegments: 3
});

watch(fontOptions, value => {
  geometry.dispose();
  geometry = new TextGeometry('你好', toRaw(value));
  cube.geometry = geometry;
  putMeshToItsCenter(cube);
});

onMounted(() => {
  rendererHelper = new RendererHelper(el.value);
  const renderer = rendererHelper.renderer;
  perspectiveCameraHelper = new PerspectiveCameraHelper(renderer.domElement);
  const camera = perspectiveCameraHelper.camera;
  camera.position.set(2, 4, 6);

  const scene = new Scene();
  const material = new MeshPhysicalMaterial({color: 0xff0000});
  // 改进：这里字符经后端获取后，拿到FontJson，再用FontLoader加载，结合本地缓存即可大幅缩减字体加载缓慢问题
  // tips：例如微软雅黑字体全部转换后有接近30M，加载会十分缓慢。
  geometry = new TextGeometry('你好', fontOptions);
  cube = new Mesh(geometry, material);
  // 注意，three.js中，文字的中心点并不在文字中心，而是在左边，以下调整中心点代码注释后就可以观察到
  putMeshToItsCenter(cube);
  parent = new Object3D();
  // 注意这里的骚操作，添加了一个parent，如果直接scene.add(mesh)，由于前面中心点并没有改变，那么后续操作旋转时，依旧是绕左侧旋转
  // 这里巧妙的加了一个parent，利用本地坐标系，由于parent的中心点是与原点对齐的，而mesh摆放的位置恰好其中心点又与原点对齐，所以旋转时看起来文字就是绕中心点旋转了
  // 同理multiplyScalar(-2)，那么文字右侧将与中心点对齐，这样旋转parent时，就是绕文字右侧旋转了。
  parent.add(cube);
  scene.add(parent);
  const light = new DirectionalLight();
  light.position.set(-4, 4, 8);
  scene.add(light);

  control = new MapControls(camera, renderer.domElement);
  control.zoomToCursor = true;

  function animate() {
    parent.rotation.y += 0.005;
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
      字体大小
      <el-input-number v-model="fontOptions.size"></el-input-number>
    </div>
    <div>
      文本厚度
      <el-input-number v-model="fontOptions.depth"></el-input-number>
    </div>
    <div>
      曲线上点的数量
      <el-input-number v-model="fontOptions.curveSegments"></el-input-number>
    </div>
    <div>
      <div>three.js自带的字体库是没法支持中文的，如果需要支持中文，有两种方案</div>
      <div>1.将中文字体使用FontSmaller拿到子集，再使用http://gero3.github.io/facetype.js在线转成JSON。</div>
      <div>2.将整个中文字体转换成JSON，后端写接口，前端传入字符拿数据。</div>
      <div>方案1适合于要显示的中文是固定的（已知的）情况。</div>
      <div>方案2适合于动态显示中文（文字可能由接口或用户输入获取，无法预测）的情况。</div>
    </div>
  </div>
</template>

<style scoped>

</style>

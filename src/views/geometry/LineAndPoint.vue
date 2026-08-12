<script setup lang="ts">
import {onMounted, onUnmounted, type Ref, shallowRef} from 'vue';
import {
  BoxGeometry, BufferAttribute, BufferGeometry, Line, LineBasicMaterial, LineSegments, Points, PointsMaterial, Scene,
  SphereGeometry,
  Vector3,
  WireframeGeometry
} from 'three';
import {MapControls} from 'three/examples/jsm/controls/MapControls.js';
import RendererHelper from '../../core/helpers/RendererHelper';
import PerspectiveCameraHelper from '../../core/helpers/PerspectiveCameraHelper';
import {RenderMonitor} from '../../core/RenderMonitor.ts';

const el = shallowRef() as Ref<HTMLDivElement>;
let rendererHelper: RendererHelper;
let perspectiveCameraHelper: PerspectiveCameraHelper;
let control: MapControls;

onMounted(() => {
  rendererHelper = new RendererHelper(el.value);
  const renderer = rendererHelper.renderer;
  new RenderMonitor(renderer);
  perspectiveCameraHelper = new PerspectiveCameraHelper(renderer.domElement);
  const camera = perspectiveCameraHelper.camera;
  camera.position.set(2, 2, 10);

  const scene = new Scene();
  const boxGeometry = new BoxGeometry();
  const line1 = new Line(boxGeometry, new LineBasicMaterial({color: 0xff0000}));
  scene.add(line1);
  const line2 = new LineSegments(boxGeometry, new LineBasicMaterial({color: 0xff}));
  line2.position.set(0, 2, 0);
  scene.add(line2);
  // WireframeGeometry解决缺边或者多边问题，line1和line2在图上可以看到明显的缺边或者多边，WireframeGeometry则几乎和片元一致。
  const line3 = new LineSegments(new WireframeGeometry(boxGeometry), new LineBasicMaterial({color: 0xff00}));
  line3.position.set(0, 4, 0);
  scene.add(line3);

  const sphereGeometry = new SphereGeometry();
  // 当sizeAttenuation为false时，此时size单位变为像素px
  const points1 = new Points(sphereGeometry, new PointsMaterial({
    color: 0xff0000,
    size: 2,
    // 指定点的大小是否因相机深度而衰减
    sizeAttenuation: false
  }));
  points1.position.set(2, 0, 0);
  scene.add(points1);
  // 默认sizeAttenuation为true，此时size单位为世界单位world units
  const point2 = new Points(sphereGeometry, new PointsMaterial({color: 0xff, size: 0.1}));
  point2.position.set(2, 2, 0);
  scene.add(point2);

  // 粒子效果
  // 1. 创建一个基础的 BufferGeometry
  const geometry = new BufferGeometry();

  // 2. 创建顶点数据（500个点，每个点有 x, y, z 三个坐标）
  const count = 500;
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 10; // 随机坐标
  }

  // 3. 将位置数据设置给 geometry
  geometry.setAttribute('position', new BufferAttribute(positions, 3));

  // 4. 创建材质
  const material = new PointsMaterial({
    color: 0x00ff00,
    size: 5,
    sizeAttenuation: false // 此时大小固定为 5 像素
  });

  // 5. 传入 BufferGeometry 创建 Points 实例
  const particleSystem = new Points(geometry, material);
  scene.add(particleSystem);

  control = new MapControls(camera, renderer.domElement);
  control.zoomToCursor = true;
  control.screenSpacePanning = true;
  control.target = new Vector3(4, 2, 0);
  control.addEventListener('change', () => {
    rendererHelper.needUpdate();
  })

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
</template>

<style scoped>

</style>

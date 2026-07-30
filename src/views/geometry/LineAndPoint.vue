<script setup lang="ts">
import {onMounted, onUnmounted, type Ref, shallowRef} from 'vue';
import {
  BoxGeometry, Line, LineBasicMaterial, LineSegments, Points, PointsMaterial, Scene, SphereGeometry, Vector3,
  WireframeGeometry
} from 'three';
import {MapControls} from 'three/examples/jsm/controls/MapControls';
import RendererHelper from '@/core/helpers/RendererHelper';
import PerspectiveCameraHelper from '@/core/helpers/PerspectiveCameraHelper';

const el = shallowRef() as Ref<HTMLDivElement>;
let rendererHelper: RendererHelper;
let perspectiveCameraHelper: PerspectiveCameraHelper;
let control: MapControls;

onMounted(() => {
  rendererHelper = new RendererHelper(el.value);
  const renderer = rendererHelper.renderer;
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

  control = new MapControls(camera, renderer.domElement);
  control.zoomToCursor = true;
  control.target = new Vector3(4, 2, 0);

  function animate() {
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
  </div>
</template>

<style scoped>

</style>

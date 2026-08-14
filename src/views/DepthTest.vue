<script setup lang="ts">
import {onMounted, onUnmounted, ref, type Ref, shallowRef, watch} from 'vue';
import {
  BoxGeometry,
  CylinderGeometry,
  DirectionalLight,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  PlaneGeometry,
  Scene
} from 'three';
import {MapControls} from 'three/examples/jsm/controls/MapControls.js';
import RendererHelper from '../core/helpers/RendererHelper';
import PerspectiveCameraHelper from '../core/helpers/PerspectiveCameraHelper';
import {RenderMonitor} from '../core/RenderMonitor.ts';

const el = shallowRef() as Ref<HTMLDivElement>;
let rendererHelper: RendererHelper;
let perspectiveCameraHelper: PerspectiveCameraHelper;
let control: MapControls;
let cylinderMaterial: MeshPhysicalMaterial;
let boxMaterial: MeshPhysicalMaterial;
let boxMesh: Mesh;
let cylinderMesh: Mesh;
let planeMeshBasicMaterial: MeshBasicMaterial;
let planeShadowMeshBasicMaterial: MeshBasicMaterial;
let plane: Mesh;
let planeShadow: Mesh;

const cylinderDepthTest = ref(true);
const boxDepthTest = ref(true);
const cylinderRenderOrder = ref(0);
const boxRenderOrder = ref(0);
const planeDepthWrite = ref(true);
const planeShadowDepthWrite = ref(true);
const planeRenderOrder = ref(0);
const planeShadowRenderOrder = ref(0);

watch(cylinderDepthTest, value => {
  cylinderMaterial.depthTest = value;
  rendererHelper.needUpdate()
});
watch(boxDepthTest, value => {
  boxMaterial.depthTest = value;
  rendererHelper.needUpdate()
});
watch(cylinderRenderOrder, value => {
  cylinderMesh.renderOrder = value;
  rendererHelper.needUpdate()
});
watch(boxRenderOrder, value => {
  boxMesh.renderOrder = value;
  rendererHelper.needUpdate()
});
watch(planeDepthWrite, value => {
  planeMeshBasicMaterial.depthWrite = value;
  rendererHelper.needUpdate()
});
watch(planeShadowDepthWrite, value => {
  planeShadowMeshBasicMaterial.depthWrite = value;
  rendererHelper.needUpdate()
});
watch(planeRenderOrder, value => {
  plane.renderOrder = value;
  rendererHelper.needUpdate()
});
watch(planeShadowRenderOrder, value => {
  planeShadow.renderOrder = value;
  rendererHelper.needUpdate()
});

onMounted(() => {
  rendererHelper = new RendererHelper(el.value);
  const renderer = rendererHelper.renderer;
  new RenderMonitor(renderer);
  perspectiveCameraHelper = new PerspectiveCameraHelper(renderer.domElement);
  const camera = perspectiveCameraHelper.camera;
  camera.position.set(4, 2, 6);

  const scene = new Scene();
  const directionalLight = new DirectionalLight();
  directionalLight.position.set(0, 10, 10);
  const cylinderGeometry = new CylinderGeometry(0.2, 0.2, 2);
  const boxGeometry = new BoxGeometry();
  // 下面圆柱体和立方体的创建顺序，决定了最终的渲染顺序，这里由于圆柱体后创建，所以圆柱体后渲染（在关闭depthTest后可以看到效果）
  boxMaterial = new MeshPhysicalMaterial({
    color: 0xff0000,
    depthTest: boxDepthTest.value
  });
  cylinderMaterial = new MeshPhysicalMaterial({
    color: 0xff,
    depthTest: cylinderDepthTest.value
  });
  boxMesh = new Mesh(boxGeometry, boxMaterial);
  cylinderMesh = new Mesh(cylinderGeometry, cylinderMaterial);
  scene.add(boxMesh);
  scene.add(cylinderMesh);
  scene.add(directionalLight);

  // 添加平面
  const planeGeometry = new PlaneGeometry(1, 1);
  planeMeshBasicMaterial = new MeshBasicMaterial({color: 0xdddddd});
  plane = new Mesh(planeGeometry, planeMeshBasicMaterial);
  plane.position.set(3, 0, 0);
  scene.add(plane);

  // 添加阴影平面
  const planeShadowGeometry = new PlaneGeometry(0.5, 0.5);
  planeShadowMeshBasicMaterial = new MeshBasicMaterial({color: 0x444444});
  planeShadow = new Mesh(planeShadowGeometry, planeShadowMeshBasicMaterial);
  // 设置阴影十分贴近地面，这样会出现Z争斗
  planeShadow.position.set(3, 0, 0);
  scene.add(planeShadow);

  control = new MapControls(camera, renderer.domElement);
  control.zoomToCursor = true;
  control.addEventListener('change', () => {
    rendererHelper.needUpdate();
  });

  rendererHelper.startLoop(scene, camera)
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
    <div class="rounded-lg w-md space-y-2 p-2 absolute left-2 top-2 bg-default">
      <div>
        <USwitch label="立方体深度检测" v-model="boxDepthTest"></USwitch>
      </div>
      <div>
        <USwitch label="圆柱体深度检测" v-model="cylinderDepthTest"></USwitch>
      </div>
      <div>
        <USwitch label="白色底面的深度写" v-model="planeDepthWrite"></USwitch>
      </div>
      <div>
        <USwitch label="灰色面的深度写" v-model="planeShadowDepthWrite"></USwitch>
      </div>
      <div>
        <span>立方体渲染顺序：</span>
        <UInputNumber v-model="boxRenderOrder"></UInputNumber>
      </div>
      <div>
        <span>圆柱体渲染顺序：</span>
        <UInputNumber v-model="cylinderRenderOrder"></UInputNumber>
      </div>
      <div>
        <span>白色底面的渲染顺序：</span>
        <UInputNumber v-model="planeRenderOrder"></UInputNumber>
      </div>
      <div>
        <span>灰色面的渲染顺序：</span>
        <UInputNumber v-model="planeShadowRenderOrder"></UInputNumber>
      </div>
      <div class="space-y-2">
        <div>深度测试的简单解释（抛开透明等情况）：</div>
        <div class="text-sm">
          如果开启了深度测试，每个片元就要拿自己的深度值，跟深度缓冲区中对应位置的深度值比较，如果自己离屏幕更近（默认的比较方式），且开启了深度写入，就会把深度缓冲区中这块位置的深度值替换成自己的深度值，让自己成为标杆，并有机会展示到屏幕上，后面只有这块位置比自己离屏幕更近的，才有机会替换掉自己展示到屏幕上，如果没开启深度测试，则会按绘制顺序（renderOrder相同的情况下，按材质创建的先后顺序），后面绘制的覆盖前面的
        </div>
        <div class="text-sm">
          深度写入适用于平面相交的情况，例如右边两个平面，Z平面重叠，此时它们就难以区分出来到底谁在前谁在后，进入深度写入之后，按深度检测中的绘制顺序来表渲染平面。先渲染的物体的深度写入会影响后渲染的物体。
        </div>
        <div>
          <a class="text-primary" href="https://453843655.xyz/blog/29921837538512732161">更多内容</a>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>

</style>

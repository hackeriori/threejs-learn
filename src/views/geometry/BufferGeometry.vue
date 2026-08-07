<script setup lang="ts">
import {onMounted, onUnmounted, ref, type Ref, shallowRef, watch} from 'vue';
import {
  BufferAttribute, BufferGeometry, type Side, Mesh, MeshBasicMaterial, Scene, FrontSide, BackSide, DoubleSide
} from 'three';
import {MapControls} from 'three/examples/jsm/controls/MapControls.js';
import RendererHelper from '../../core/helpers/RendererHelper';
import PerspectiveCameraHelper from '../../core/helpers/PerspectiveCameraHelper';
import {RenderMonitor} from '../../core/RenderMonitor.ts';

const el = shallowRef() as Ref<HTMLDivElement>;
let rendererHelper: RendererHelper;
let perspectiveCameraHelper: PerspectiveCameraHelper;
let control: MapControls;
const showSide = ref<Side>(FrontSide);
let material: MeshBasicMaterial;

watch(showSide, () => {
  material.side = showSide.value;
  rendererHelper.needUpdate();
});

onMounted(() => {
  rendererHelper = new RendererHelper(el.value);
  const renderer = rendererHelper.renderer;
  new RenderMonitor(renderer);
  perspectiveCameraHelper = new PerspectiveCameraHelper(renderer.domElement);
  const camera = perspectiveCameraHelper.camera;
  camera.position.set(4, 4, 4);

  const scene = new Scene();
  const geometry = new BufferGeometry();
  // 创建一个简单的矩形，这里我们使用四个点，如果不使用索引，每个三角形顶点都要加进去（即6个点）。
  const vertices = new Float32Array([
    -1.0, -1.0, 1.0,
    1.0, -1.0, 1.0,
    1.0, 1.0, 1.0,
    -1.0, 1.0, 1.0
  ]);
  // 0，1，2组成一个三角形，2，3，0组成一个三角形，
  const index = new Uint16Array([0, 1, 2, 2, 3, 0]);
  // 注意上面组成三角形是按顶点的逆时针方向组成的（逆时针组成的三角形算正面），如果按下面这种顺时针方向，正面和背面将被交换。
  // const index = new Uint16Array([0, 2, 1, 2, 0, 3]);
  // itemSize = 3 因为每个顶点都是一个三元组。
  geometry.setAttribute('position', new BufferAttribute(vertices, 3));
  geometry.setIndex(new BufferAttribute(index, 1));
  // 添加分组后，可以应用多个材质，每个分组都会在单独的 WebGL 的 draw call 中进行绘制
  geometry.addGroup(0, 3, 0);
  geometry.addGroup(3, 3, 1);
  material = new MeshBasicMaterial({color: 0xff0000, side: showSide.value});
  const material1 = new MeshBasicMaterial({color: 0x0000ff});
  const cube = new Mesh(geometry, [material, material1]);
  scene.add(cube);

  control = new MapControls(camera, renderer.domElement);
  control.zoomToCursor = true;
  control.addEventListener('change', () => {
    rendererHelper.needUpdate();
  });

  rendererHelper.startLoop(scene,camera,()=>{
    control.update()
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
        红色三角形渲染
      </div>
      <URadioGroup v-model="showSide" orientation="horizontal" :items="[
          {label: '正面', value: FrontSide},
          {label: '背面', value: BackSide},
          {label: '双面', value: DoubleSide}
        ]">
      </URadioGroup>
    </div>
  </div>
</template>

<style scoped>

</style>

<script setup lang="ts">
import {onMounted, onUnmounted, type Ref, shallowRef} from 'vue';
import {
  Color, DirectionalLight, MathUtils, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, PlaneGeometry, Scene,
  SphereGeometry, TextureLoader
} from 'three';
import {MapControls} from 'three/examples/jsm/controls/MapControls';
import RendererHelper from '@/core/helpers/RendererHelper';
import PerspectiveCameraHelper from '@/core/helpers/PerspectiveCameraHelper';
import {tryLoad} from '@/core/shared';

const el = shallowRef() as Ref<HTMLDivElement>;
let rendererHelper: RendererHelper;
let perspectiveCameraHelper: PerspectiveCameraHelper;
let control: MapControls;

interface BallListType {
  base: Object3D,
  shadowBall: Mesh<PlaneGeometry, MeshBasicMaterial>,
  ball: Mesh<SphereGeometry, MeshStandardMaterial>
}

onMounted(async () => {
  rendererHelper = new RendererHelper(el.value);
  const frameRender = () => {
    rendererHelper.needUpdate();
  };
  const renderer = rendererHelper.renderer;
  perspectiveCameraHelper = new PerspectiveCameraHelper(renderer.domElement);
  perspectiveCameraHelper.addEventListener('changed', frameRender);
  const camera = perspectiveCameraHelper.camera;
  camera.position.set(0, 15, 15);

  const scene = new Scene();
  // 添加观察平面
  const planeGeometry = new PlaneGeometry(40, 40);
  // 平面不需要光照，使用标准材质，这里depthWrite防止镜头拉远后，与阴影重叠
  const planeMesh = new Mesh(planeGeometry, new MeshBasicMaterial({color: 0xC0C0C0, depthWrite: false}));
  planeMesh.rotation.x = Math.PI * -.5;
  scene.add(planeMesh);
  // 添加小球和阴影
  const textureLoader = new TextureLoader();
  const texture = await tryLoad(textureLoader, './resources/images/roundshadow.png');
  const sphereShadowBases: BallListType[] = [];
  for (let i = 0; i < 15; i++) {
    // 添加一个基础Object3D，放入小球和阴影，这样它们可以一起移动
    const base = new Object3D();
    const ballShadowMeshBasicMaterial = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      // 禁用深度写入，这样阴影之间不会彼此混淆，注意这里并没有开启depthTest: false，因为那样做会导致阴影始终渲染在球的上方
      depthWrite: false
    });
    const shadowBall = new Mesh(new PlaneGeometry(4, 4), ballShadowMeshBasicMaterial);
    shadowBall.position.set(0, 0.01, 0);
    shadowBall.rotation.x = Math.PI * -0.5;
    base.add(shadowBall);
    const ball = new Mesh(new SphereGeometry(1), new MeshStandardMaterial({
      color: new Color().setHSL(i / 15, 1, 0.75)
    }));
    ball.position.set(0, 3, 0);
    base.add(ball);
    sphereShadowBases.push({
      base,
      shadowBall,
      ball
    });
    ball.onAfterRender = frameRender;
    shadowBall.onAfterRender = frameRender;
    rendererHelper.addDynamicObject(base);
    scene.add(base);
  }
  // 添加平行光
  const light = new DirectionalLight();
  light.position.set(5, 10, -5);
  scene.add(light);

  control = new MapControls(camera, renderer.domElement);
  control.zoomToCursor = true;
  control.update();
  control.addEventListener('change', frameRender);

  rendererHelper.startLoop(scene, camera, (time) => {
    // 时间更改为秒
    time *= 0.001;
    sphereShadowBases.forEach((sphereShadowBase, i) => {
      const {base, shadowBall, ball} = sphereShadowBase;
      // u是一个0到1之间的数
      const u = i / sphereShadowBases.length;
      // compute a position for the base. This will move
      // both the sphere and its shadow
      const speed = time * .2;
      const angle = speed + u * Math.PI * 2 * (i % 1 ? 1 : -1);
      const radius = Math.sin(speed - i) * 10;
      base.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);

      // yOff is a value that goes from 0 to 1
      const yOff = Math.abs(Math.sin(time * 2 + i));
      // move the sphere up and down
      ball.position.y = 3 + MathUtils.lerp(-2, 2, yOff);
      // fade the shadow as the sphere goes up
      shadowBall.material.opacity = MathUtils.lerp(1, .25, yOff);
    });
  });
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
    <div style="width: 300px">
      添加阴影，需要打开渲染器的允许阴影，renderer.shadowMap.enabled = true;
    </div>
    <div style="width: 300px">
      灯光和物体发出阴影，castShadow = true;
    </div>
    <div style="width: 300px">
      平面接收阴影，receiveShadow = true
    </div>
    <div style="width: 300px">
      产生阴影是非常昂贵的计算，有多少产生阴影的灯光，整个场景就会渲染多少次。优化方案可以只让其中一个灯光产生阴影，或者使用光照贴图或者环境光贴图，预先计算离线照明的效果，或者使用假阴影。
    </div>
  </div>
</template>

<style scoped>

</style>

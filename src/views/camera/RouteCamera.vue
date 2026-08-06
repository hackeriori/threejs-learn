<script setup lang="ts">
import {onMounted, onUnmounted, ref, type Ref, shallowRef} from 'vue';
import {BoxGeometry, Mesh, MeshBasicMaterial, Scene, Vector3, MathUtils, Quaternion, type Camera, Euler} from 'three';
import RendererHelper from '../../core/helpers/RendererHelper';
import PerspectiveCameraHelper from '../../core/helpers/PerspectiveCameraHelper';

type LookType = -1 | 0 | 1;

const el = shallowRef() as Ref<HTMLDivElement>;
let rendererHelper: RendererHelper;
let perspectiveCameraHelper: PerspectiveCameraHelper;
let camera: Camera;
const lookLeft = ref<LookType>(1);
const lookUp = ref<LookType>(0);
const lookRoute = ref<LookType>(0);

onMounted(() => {
  rendererHelper = new RendererHelper(el.value);
  const renderer = rendererHelper.renderer;
  perspectiveCameraHelper = new PerspectiveCameraHelper(renderer.domElement);
  camera = perspectiveCameraHelper.camera;

  const scene = new Scene();
  const geometry = new BoxGeometry(1, 1, 1);
  {
    const material = new MeshBasicMaterial({color: 0xff0000});
    const cube = new Mesh(geometry, material);
    cube.position.set(0, 0, -10);
    scene.add(cube);
  }
  {
    const material = new MeshBasicMaterial({color: 0x00ff00});
    const cube = new Mesh(geometry, material);
    cube.position.set(-10, 0, 0);
    scene.add(cube);
  }
  {
    const material = new MeshBasicMaterial({color: 0x0000ff});
    const cube = new Mesh(geometry, material);
    cube.position.set(0, 0, 10);
    scene.add(cube);
  }
  {
    const material = new MeshBasicMaterial({color: 0x00ffff});
    const cube = new Mesh(geometry, material);
    cube.position.set(10, 0, 0);
    scene.add(cube);
  }

  function animate() {
    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(animate);
});

function setFromQuaternion() {
  // setFromAxisAngle的意思，是绕某个轴的方向”顺时针“旋转（松螺丝方向）固定角度
  // 例如setFromAxisAngle(new Vector3(0, 1, 0), MathUtils.degToRad(10))，表示绕Y轴顺时针转10度，相当于向左转头10度，此时立方体应该在镜头右边。
  // 例如setFromAxisAngle(new Vector3(1, 0, 0), MathUtils.degToRad(10))，表示绕X轴顺时针转10度，相当于向上抬头10度，此时立方体应该在镜头下方。
  // 例如setFromAxisAngle(new Vector3(0, 0, 1), MathUtils.degToRad(10))，表示绕Z轴顺时针转10度，相当于向左偏头10度，此时立方体应该往右旋转。
  // 有多个分量的情况下，叠加即可，例如new Vector3(1, 1, 0)，表示向左向上看，此时物体应该在右下角。
  camera.quaternion.setFromAxisAngle(new Vector3(lookUp.value, lookLeft.value, lookRoute.value), MathUtils.degToRad(10));
}

function multiply() {
  const quaternion = new Quaternion();
  quaternion.setFromAxisAngle(new Vector3(lookUp.value, lookLeft.value, lookRoute.value), MathUtils.degToRad(10));
  // 对四元素做乘法运算相当于在相机当前的朝向基础上再相对旋转。
  camera.quaternion.multiply(quaternion);
}

function setFromEuler() {
  const euler = new Euler();
  euler.setFromQuaternion(camera.quaternion);
  // 这里欧拉角的x,y,z也是指的轴，赋值相当于绕轴旋转，同上面的
  if (lookUp.value)
    euler.x += lookUp.value * MathUtils.degToRad(10);
  if (lookLeft.value)
    euler.y += lookLeft.value * MathUtils.degToRad(10);
  if (lookRoute.value)
    euler.z += lookRoute.value * MathUtils.degToRad(10);
  camera.quaternion.setFromEuler(euler);
}

function reset() {
  camera.quaternion.setFromAxisAngle(new Vector3(0, 0, 0), 0);
}

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
      <div>
        <URadioGroup v-model="lookLeft" orientation="horizontal" :items="[
        {label: '向左看', value: 1},
        {label: '不动', value: 0},
        {label: '向右看', value: -1}
      ]">
        </URadioGroup>
      </div>
      <div>
        <URadioGroup v-model="lookUp" orientation="horizontal" :items="[
        {label: '向上看', value: 1},
        {label: '不动', value: 0},
        {label: '向下看', value: -1}
      ]">
        </URadioGroup>
      </div>
      <div>
        <URadioGroup v-model="lookRoute" orientation="horizontal" :items="[
        {label: '向左偏头', value: 1},
        {label: '不动', value: 0},
        {label: '向右偏头', value: -1}
      ]">
        </URadioGroup>
      </div>
      <div class="ls-text-line">
        <UButton @click="reset">复位</UButton>
      </div>
      <div class="space-y-2">
        <div>使用"四元数"旋转，转动幅度为10度</div>
        <div class="text-sm text-muted">
          注意左、下、右、上这样转一圈后，头会相当于往左偏，这是因为乘积是相当于在原来的旋转上再旋转，头不正时左右摆头会旋转Z
        </div>
      </div>
      <div class="space-x-4">
        <UButton @click="setFromQuaternion">转头</UButton>
        <UButton @click="multiply">连续转头</UButton>
      </div>
      <div>使用"欧拉角"旋转，转动幅度为10度，转一圈后，头不会偏</div>
      <div>
        <UButton @click="setFromEuler">连续转头</UButton>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>

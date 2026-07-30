<script setup lang="ts">
import {onMounted, onUnmounted, ref, type Ref, shallowRef} from 'vue';
import {
  BoxGeometry, Mesh, MeshBasicMaterial, Scene, Vector3, MathUtils, Quaternion, type Camera, Euler, Spherical
} from 'three';
import RendererHelper from '@/core/helpers/RendererHelper';
import PerspectiveCameraHelper from '@/core/helpers/PerspectiveCameraHelper';

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
  camera.position.set(0, 0, 10);

  const scene = new Scene();
  const geometry = new BoxGeometry(1, 1, 1);
  const material = new MeshBasicMaterial({color: 0xff0000});
  const cube = new Mesh(geometry, material);
  scene.add(cube);

  function animate() {
    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(animate);
});

function setFromQuaternion() {
  // setFromAxisAngle的意思，是绕某个轴的方向”顺时针“旋转（松螺丝方向）固定角度
  // 例如setFromAxisAngle(new Vector3(0, 1, 0), MathUtils.degToRad(10))，表示绕Y轴顺时针转15度，相当于向左转头15度，此时立方体应该在镜头右边。
  // 例如setFromAxisAngle(new Vector3(1, 0, 0), MathUtils.degToRad(10))，表示绕X轴顺时针转15度，相当于向上抬头15度，此时立方体应该在镜头下方。
  // 例如setFromAxisAngle(new Vector3(0, 0, 1), MathUtils.degToRad(10))，表示绕Z轴顺时针转15度，相当于向左偏头15度，此时立方体应该往右旋转。
  // 有多个分量的情况下，叠加即可，例如new Vector3(1, 1, 0)，表示向左向上看，此时物体应该在右下角。
  camera.quaternion.setFromAxisAngle(new Vector3(lookUp.value, lookLeft.value, lookRoute.value), MathUtils.degToRad(10));
  // 三维向量
  const vector3 = (new Vector3(0, 0, -1)).applyQuaternion(camera.quaternion);
  // 球坐标
  const spherical = (new Spherical()).setFromVector3(vector3);
  console.log(vector3);
  console.log(spherical);
  console.log(camera.quaternion);
}

function multiply() {
  const quaternion = new Quaternion();
  quaternion.setFromAxisAngle(new Vector3(lookUp.value, lookLeft.value, lookRoute.value), MathUtils.degToRad(10));
  // 对四元素做乘法运算相当于连续两次旋转对应的四元素，也可以理解为在当前四元素的基础上再相对旋转。
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
  <div class="height100 ls-abs-outer">
    <div class="height100" ref="el">
    </div>
  </div>
  <div class="controlBox">
    <div>
      <el-radio-group v-model="lookLeft">
        <el-radio :label="1">向左看</el-radio>
        <el-radio :label="0">不动</el-radio>
        <el-radio :label="-1">向右看</el-radio>
      </el-radio-group>
    </div>
    <div>
      <el-radio-group v-model="lookUp">
        <el-radio :label="1">向上看</el-radio>
        <el-radio :label="0">不动</el-radio>
        <el-radio :label="-1">向下看</el-radio>
      </el-radio-group>
    </div>
    <div>
      <el-radio-group v-model="lookRoute">
        <el-radio :label="1">向左偏头</el-radio>
        <el-radio :label="0">不动</el-radio>
        <el-radio :label="-1">向右偏头</el-radio>
      </el-radio-group>
    </div>
    <div class="ls-text-line">
      <el-button @click="reset">复位</el-button>
    </div>
    <div class="ls-text-line">
      <div>使用"四元数"旋转，转动幅度为10度</div>
      <div>注意左、下、右、上这样转一圈后，头会相当于往左偏，这是因为</div>
      <div>乘积是相当于在原来的旋转上再旋转，头不正时左右摆头会旋转Z</div>
    </div>
    <div>
      <el-button type="primary" @click="setFromQuaternion">转头</el-button>
      <el-button type="primary" @click="multiply">连续转头</el-button>
    </div>
    <div class="ls-text-line">使用"欧拉角"旋转，转动幅度为10度，转一圈后，头不会偏</div>
    <div>
      <el-button type="primary" @click="setFromEuler">连续转头</el-button>
    </div>
  </div>
</template>

<style scoped>

</style>

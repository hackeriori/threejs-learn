import type {WebGLRendererParameters} from 'three';
import {
  Box3, type Camera, EventDispatcher, Frustum, Matrix4, type Mesh, type Object3D, Sphere,
  Timer, WebGLRenderer
} from 'three';
import {getDomSize} from '../shared';
import type {SimpleChangedEvent} from './types';

// 定义用于记录物体状态的接口
interface ObjectState {
  // 物体上一帧的世界矩阵
  matrixWorld: Matrix4;
  // 物体上一帧是否可见
  wasVisible: boolean;
}

export default class RendererHelper extends EventDispatcher<SimpleChangedEvent> {
  // WebGLRenderer
  public readonly renderer: WebGLRenderer;
  // Timer 计时器对象
  public readonly timer: Timer;
  // 父节点dom
  readonly #parentDom: HTMLDivElement;
  // 尺寸变化观察器
  readonly #resizeObserver: ResizeObserver;
  // 是否需要重新渲染
  #needRender = true;
  // 动态物体集
  readonly #dynamicObjects = new Map<Object3D, ObjectState>();
  // 场景矩阵
  readonly #projScreenMatrix = new Matrix4();
  // 视锥体
  readonly #frustum = new Frustum();
  // 用于复用的计算对象，减少 GC
  readonly #tempBox = new Box3();
  readonly #tempSphere = new Sphere();

  constructor(parent: HTMLDivElement, webGLRendererParameters?: WebGLRendererParameters) {
    super();
    this.#parentDom = parent;
    this.renderer = new WebGLRenderer(webGLRendererParameters);
    this.timer = new Timer();
    this.timer.connect(document);

    this.#updateSize();

    // 监听父元素而不是 Canvas 本身，避免由于 Canvas 100% 导致某些浏览器下的尺寸循环触发
    this.#resizeObserver = new ResizeObserver(() => {
      this.#updateSize();
      this.dispatchEvent({type: 'changed'});
    });
    this.#resizeObserver.observe(this.#parentDom);

    const canvas = this.renderer.domElement;
    this.#parentDom.appendChild(canvas);
    // 设置tabIndex以便可以获取焦点
    canvas.tabIndex = 0;
    // 禁用焦点样式
    canvas.style.outline = 'none';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    // 设置焦点，以便后续可以通过键盘控制
    canvas.focus();
  }

  /**
   * 释放资源
   */
  dispose() {
    this.timer.dispose();
    this.#resizeObserver.disconnect();
    this.renderer.dispose();
    this.#dynamicObjects.clear();
  }

  /**
   * 通知当前帧需要重新渲染。
   */
  needUpdate() {
    this.#needRender = true;
  }

  /**
   * 开始逐帧循环
   * @param scene 场景
   * @param camera 相机
   * @param loopFun 自定义逐帧循环调用函数，在确定渲染开始前执行，动态物体的移动也放在这里执行，timer在此之前已计算
   * @param renderFun 自定义渲染函数，例如使用多个相机的情况，在确定渲染后执行
   */
  startLoop(scene: Object3D, camera: Camera, loopFun?: XRFrameRequestCallback, renderFun?: XRFrameRequestCallback) {
    this.renderer.setAnimationLoop((time, frame) => {
      this.timer.update(time);
      loopFun?.(time, frame);

      // 只有在不需要渲染时，才去检查动态物体是否打破了平静
      if (!this.#needRender && this.#dynamicObjects.size > 0) {
        this.#computedMatrixAndIntersects(camera);
      }

      if (this.#needRender) {
        this.#needRender = false;
        if (renderFun) {
          renderFun(time, frame);
        } else {
          this.renderer.render(scene, camera);
        }
      }
    });
  }

  /**
   * 添加动态物体
   * ✅ 建议加入 addDynamicObject 的情况：
   * 黑盒动画驱动的物体：比如你加载了一个带位移动画的 GLTF 模型，由 AnimationMixer 控制，你不知道它什么时候动、什么时候停。把它加进去，让底层去检测。
   * 物理引擎控制的物体：比如一群掉落的方块，由物理引擎计算运动。它们静止（休眠）后不需要渲染，运动时需要渲染。把它加进去，非常合适。
   * 复杂的父子联动体系：父节点在动，你懒得去手动计算子节点是否在相机视野内，把相关的子节点加进去。
   * 巡逻的 NPC / 自动飞行的子弹：有自己的独立生命周期和运动逻辑，随时可能飞出相机视野的物体。
   * ❌ 不建议加入 addDynamicObject 的情况（直接调 needUpdate 更好）：
   * UI直接控制的物体：例如按钮控制移动。因为是你按下的按钮，你 100% 知道它变了，直接在对应的回调里调用 rendererHelper.needUpdate() 性能最高，不需要劳烦底层每一帧去对比矩阵。
   * 跟随鼠标/相机的物体：鼠标一动它就动，直接监听 mousemove 或 OrbitControls 的 change 事件去触发 needUpdate() 即可。
   * 完全静态的物体：比如场景里的地形、房子、不动的树，千万别加进去。
   * @param object
   */
  addDynamicObject(object: Object3D) {
    if (!this.#dynamicObjects.has(object)) {
      this.#dynamicObjects.set(object, {
        matrixWorld: object.matrixWorld.clone(),
        wasVisible: false // 初始设为 false，强制第一次检测
      });
      this.needUpdate(); // 新增物体，通常需要触发一次渲染
    }
  }

  /**
   * 移除动态物体
   * @param object
   */
  removeDynamicObject(object: Object3D) {
    if (this.#dynamicObjects.has(object)) {
      this.#dynamicObjects.delete(object);
      this.needUpdate(); // 移除物体，画面需要更新
    }
  }

  /**
   * 更新矩阵，计算视锥体相交，以判断是否需要更新
   */
  #computedMatrixAndIntersects(camera: Camera) {
    // 计算场景矩阵
    this.#projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    // 计算视锥体
    this.#frustum.setFromProjectionMatrix(this.#projScreenMatrix, camera.coordinateSystem);

    for (const [object, state] of this.#dynamicObjects.entries()) {
      // 1. 更新物体的世界矩阵
      object.updateMatrixWorld(true);

      // 2. 检查物体是否发生移动/旋转/缩放
      const isMatrixChanged = !state.matrixWorld.equals(object.matrixWorld);

      // 3. 计算当前可见性 (使用包围盒/包围球比递归检查子元素快得多)
      let isVisible = false;
      const meshObj = object as Mesh;
      // 使用包围球进行快速判断
      if (meshObj.geometry) {
        if (!meshObj.geometry.boundingSphere) {
          meshObj.geometry.computeBoundingSphere();
        }
        if (meshObj.geometry.boundingSphere) {
          this.#tempSphere.copy(meshObj.geometry.boundingSphere).applyMatrix4(object.matrixWorld);
          isVisible = this.#frustum.intersectsSphere(this.#tempSphere);
        }
      } else {
        // 如果是 Group 等空节点，使用 Box3 包含所有子元素，注意这个是逐子元素检测，速度较慢
        this.#tempBox.setFromObject(object);
        isVisible = this.#frustum.intersectsBox(this.#tempBox);
      }

      // 4. 核心逻辑判断：何时需要更新画面？
      // - 条件 A：物体矩阵发生了变化，且当前在视野内 (正在移动中)
      // - 条件 B：物体的可见性发生了翻转 (刚好进入视野，或刚好离开视野)
      if ((isMatrixChanged && isVisible) || (isVisible !== state.wasVisible)) {
        this.needUpdate();
      }

      // 5. 更新缓存状态，供下一帧使用
      if (isMatrixChanged) {
        state.matrixWorld.copy(object.matrixWorld);
      }
      state.wasVisible = isVisible;

      // 如果已经标记需要渲染，就可以跳出循环了，不需要再检查其他物体
      if (this.#needRender) break;
    }
  }

  /**
   * 更新canvas的渲染宽高，使得它与父元素的宽高对齐
   * @private
   */
  #updateSize() {
    const size = getDomSize(this.#parentDom);
    if (this.renderer.domElement.width !== size.width || this.renderer.domElement.height !== size.height) {
      this.renderer.setSize(size.width, size.height, false);
      this.needUpdate();
    }
  }
}

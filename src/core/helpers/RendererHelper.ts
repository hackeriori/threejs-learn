import type {WebGLRendererParameters} from 'three';
import {
  type Camera, EventDispatcher, Frustum, type Line, Matrix4, type Mesh, type Object3D, type Points, type Sprite,
  WebGLRenderer
} from 'three';
import {getDomSize} from '../shared';
import type {SimpleChangedEvent} from './types';

export default class RendererHelper extends EventDispatcher<SimpleChangedEvent> {
  // WebGLRenderer
  public readonly renderer: WebGLRenderer;
  // 父节点dom
  readonly #parentDom: HTMLDivElement;
  // 尺寸变化观察器
  readonly #resizeObserver: ResizeObserver;
  // 是否需要重新渲染
  #needRender = true;
  // 动态物体集
  readonly #dynamicObjects = new Set<Object3D>();
  // 场景矩阵
  readonly #projScreenMatrix = new Matrix4();
  // 视锥体
  readonly #frustum = new Frustum();

  constructor(parent: HTMLDivElement, webGLRendererParameters?: WebGLRendererParameters) {
    super();
    this.#parentDom = parent;
    this.renderer = new WebGLRenderer(webGLRendererParameters);
    this.#updateSize();
    this.#resizeObserver = new ResizeObserver(() => {
      this.#updateSize();
      this.dispatchEvent({type: 'changed'});
    });
    const canvas = this.renderer.domElement;
    this.#resizeObserver.observe(canvas);
    parent.appendChild(canvas);
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
   * @param loopFun 自定义逐帧循环调用函数，在确定渲染开始前执行，动态物体的移动也放在这里执行
   * @param renderFun 自定义渲染函数，例如使用多个相机的情况，在确定渲染后执行
   */
  startLoop(scene: Object3D, camera: Camera, loopFun?: XRFrameRequestCallback, renderFun?: XRFrameRequestCallback) {
    this.renderer.setAnimationLoop((time, frame) => {
      loopFun?.(time, frame);
      if (!this.#needRender && this.#dynamicObjects.size)
        this.#computedMatrixAndIntersects(camera);
      if (this.#needRender) {
        this.#needRender = false;
        if (renderFun)
          renderFun(time, frame);
        else
          this.renderer.render(scene, camera);
      }
    });
  }

  /**
   * 添加动态物体
   * @param object
   */
  addDynamicObject(object: Object3D) {
    this.#dynamicObjects.add(object);
  }

  /**
   * 移除动态物体
   * @param object
   */
  removeDynamicObject(object: Object3D) {
    this.#dynamicObjects.delete(object);
  }

  /**
   * 更新矩阵，计算视锥体相交，以判断是否需要更新
   */
  #computedMatrixAndIntersects(camera: Camera) {
    /**
     * 判断空节点的子元素是否出现在相机中，任何一个子元素出现在相机中则立即返回
     * @param object
     * @param frustum
     */
    function childrenNeedUpdate(object: Object3D, frustum: Frustum): boolean {
      for (let i = 0; i < object.children.length; i++) {
        const child = object.children[i];
        if ((child as Sprite).isSprite) {
          if (frustum.intersectsSprite(child as Sprite))
            return true;
        } else if ((child as Mesh).isMesh || (child as Line).isLine || (child as Points).isPoints) {
          if (frustum.intersectsObject(child))
            return true;
        } else if (childrenNeedUpdate(child, frustum)) {
          return true;
        }
      }
      return false;
    }

    // 计算场景矩阵
    this.#projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    // 计算视锥体
    this.#frustum.setFromProjectionMatrix(this.#projScreenMatrix, camera.coordinateSystem);
    for (const object of this.#dynamicObjects) {
      // 更新物体的世界坐标
      object.updateMatrixWorld(true);
      // 任何动态物体与视锥体相交，则需要更新
      if ((object as Sprite).isSprite) {
        if (this.#frustum.intersectsSprite(object as Sprite)) {
          this.needUpdate();
          break;
        }
      } else if ((object as Mesh).isMesh || (object as Line).isLine || (object as Points).isPoints) {
        // 相交单独判断而不放在上面一行，避免不相交时去便利子元素
        if (this.#frustum.intersectsObject(object)) {
          this.needUpdate();
          break;
        }
      } else if (childrenNeedUpdate(object, this.#frustum)) {
        // 空节点的情况下
        this.needUpdate();
        break;
      }
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
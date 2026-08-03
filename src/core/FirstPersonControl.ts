import {Euler, EventDispatcher, MathUtils, Vector3, type PerspectiveCamera} from 'three';
import type {SimpleChangedEvent} from './helpers/types';

interface TEventMap extends SimpleChangedEvent {
  lock: {
    type: 'lock'
  },
  unlock: {
    type: 'unlock'
  }
}

export default class FirstPersonControl extends EventDispatcher<TEventMap> {
  // 原始相机
  readonly #nativeCamera: PerspectiveCamera;
  // 画布对象
  readonly #canvasElement: HTMLCanvasElement;
  // 移动速度，默认值1
  #movementSpeed = 1;
  // 转头速度，默认值0.002
  #lookSpeed = 0.002;
  // 前进标志
  #moveForward = false;
  // 后退标志
  #moveBackward = false;
  // 左移标志
  #moveLeft = false;
  // 右移标志
  #moveRight = false;
  // 上移标志
  #moveUp = false;
  // 下移标志
  #moveDown = false;
  // 是否已锁定（锁定表示开始了第一人称）
  #isLocked = false;
  // 复用 Euler 对象以减小 GC 压力
  readonly #euler = new Euler(0, 0, 0, 'YXZ');
  // 复用 Vector3 对象用于合成归一化移动向量
  readonly #moveVector = new Vector3();
  // 键盘事件代理
  readonly #keyboardEventProxy: (ev: KeyboardEvent) => void;
  // 鼠标移动事件代理
  readonly #mouseMoveEventProxy: (ev: MouseEvent) => void;
  // 鼠标锁定事件代理
  readonly #pointerLockChangeProxy: () => void;
  // 鼠标锁定失败事件代理
  readonly #pointerLockErrorProxy: () => void;

  constructor(perspectiveCamera: PerspectiveCamera, domElement: HTMLCanvasElement) {
    super();
    this.#nativeCamera = perspectiveCamera;
    this.#canvasElement = domElement;
    this.#keyboardEventProxy = this.#setKeyboardFlag.bind(this);
    this.#mouseMoveEventProxy = this.#mouseMoveFlag.bind(this);
    this.#pointerLockChangeProxy = this.#pointerLockChange.bind(this);
    this.#pointerLockErrorProxy = this.#pointerLockError.bind(this);
    // 注册键盘事件
    this.#canvasElement.addEventListener('keydown', this.#keyboardEventProxy);
    this.#canvasElement.addEventListener('keyup', this.#keyboardEventProxy);
    // 注册鼠标事件
    this.#canvasElement.addEventListener('mousemove', this.#mouseMoveEventProxy);
    // 注册鼠标锁定事件
    this.#canvasElement.ownerDocument.addEventListener('pointerlockchange', this.#pointerLockChangeProxy);
    // 注册锁定失败事件
    this.#canvasElement.ownerDocument.addEventListener('pointerlockerror', this.#pointerLockErrorProxy);
  }

  // 移动速度，默认值1
  get movementSpeed() {
    return this.#movementSpeed;
  }

  set movementSpeed(value: number) {
    this.#movementSpeed = value;
  }

  // 转头速度，默认值0.002
  get lookSpeed() {
    return this.#lookSpeed;
  }

  set lookSpeed(value: number) {
    this.#lookSpeed = value;
  }

  /**
   * 销毁对象，移除事件
   */
  dispose() {
    if (this.#isLocked) this.unlock();
    // 移除键盘事件
    this.#canvasElement.removeEventListener('keydown', this.#keyboardEventProxy);
    this.#canvasElement.removeEventListener('keyup', this.#keyboardEventProxy);
    // 移除鼠标事件
    this.#canvasElement.removeEventListener('mousemove', this.#mouseMoveEventProxy);
    // 移除鼠标锁定事件
    this.#canvasElement.ownerDocument.removeEventListener('pointerlockchange', this.#pointerLockChangeProxy);
    // 移除锁定失败事件
    this.#canvasElement.ownerDocument.removeEventListener('pointerlockerror', this.#pointerLockErrorProxy);
  }

  /**
   * 激活鼠标锁定（第一人称视角）
   */
  lock() {
    void this.#canvasElement.requestPointerLock();
    this.#canvasElement.focus();
  }

  /**
   * 取消激活鼠标锁定（第一人称视角）
   */
  unlock() {
    this.#canvasElement.ownerDocument.exitPointerLock();
  }

  /**
   * 每帧更新事件
   * @param delta 帧间隔时间（秒）
   */
  update(delta: number) {
    if (!this.#isLocked) return;

    // 计算各方向移动分量
    const x = Number(this.#moveRight) - Number(this.#moveLeft);
    const y = Number(this.#moveUp) - Number(this.#moveDown);
    const z = Number(this.#moveBackward) - Number(this.#moveForward);

    if (x !== 0 || y !== 0 || z !== 0) {
      // 合成移动向量并归一化，统一在相机局部坐标系下平移，防止斜向移动速度过快
      this.#moveVector.set(x, y, z).normalize();
      const distance = this.#movementSpeed * delta;

      if (this.#moveVector.x !== 0) {
        this.#nativeCamera.translateX(this.#moveVector.x * distance);
      }
      if (this.#moveVector.y !== 0) {
        this.#nativeCamera.translateY(this.#moveVector.y * distance);
      }
      if (this.#moveVector.z !== 0) {
        this.#nativeCamera.translateZ(this.#moveVector.z * distance);
      }

      this.dispatchEvent({type: 'changed'});
    }
  }

  /**
   * 根据按键设置相机运动状态
   * @param ev 键盘参数
   */
  #setKeyboardFlag(ev: KeyboardEvent) {
    const isDown = ev.type === 'keydown';
    switch (ev.code) {
      case 'KeyW':
        this.#moveForward = isDown;
        break;
      case 'KeyA':
        this.#moveLeft = isDown;
        break;
      case 'KeyS':
        this.#moveBackward = isDown;
        break;
      case 'KeyD':
        this.#moveRight = isDown;
        break;
      case 'KeyR':
        this.#moveUp = isDown;
        break;
      case 'KeyF':
        this.#moveDown = isDown;
        break;
    }
  }

  /**
   * 根据鼠标在画布中的位置，设置相机朝向
   * @param ev 鼠标参数
   */
  #mouseMoveFlag(ev: MouseEvent) {
    if (!this.#isLocked) return;
    const movementX = ev.movementX;
    const movementY = ev.movementY;
    // 使用复用的欧拉角对象
    this.#euler.setFromQuaternion(this.#nativeCamera.quaternion);
    this.#euler.y -= movementX * this.#lookSpeed;
    this.#euler.x -= movementY * this.#lookSpeed;
    // 限制俯仰角在 (-PI/2 + 0.0001, PI/2 - 0.0001) 范围，防止死锁或死角翻转
    const maxPitch = Math.PI / 2 - 0.0001;
    this.#euler.x = MathUtils.clamp(this.#euler.x, -maxPitch, maxPitch);
    this.#nativeCamera.quaternion.setFromEuler(this.#euler);
    this.dispatchEvent({type: 'changed'});
  }

  /**
   * 鼠标锁定/解锁事件
   * @private
   */
  #pointerLockChange() {
    if (this.#canvasElement.ownerDocument.pointerLockElement === this.#canvasElement) {
      this.#isLocked = true;
      this.dispatchEvent({type: 'lock'});
      this.dispatchEvent({type: 'changed'});
    } else {
      this.#isLocked = false;
      // 防止失焦导致 keyup 漏触发从而卡键
      this.#moveForward = this.#moveBackward = false;
      this.#moveLeft = this.#moveRight = false;
      this.#moveUp = this.#moveDown = false;
      this.dispatchEvent({type: 'unlock'});
      this.dispatchEvent({type: 'changed'});
    }
  }

  /**
   * 鼠标锁定失败事件
   */
  #pointerLockError() {
    console.error('无法使用Pointer Lock API');
  }
}
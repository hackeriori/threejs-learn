import {Euler, EventDispatcher, MathUtils, type PerspectiveCamera} from 'three';
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
   */
  update() {
    if (!this.#isLocked) return;
    // 是否移动了
    let moved = false;
    // 前后移动
    if (this.#moveForward && !this.#moveBackward) {
      moved = true;
      this.#nativeCamera.translateZ(-this.#movementSpeed);
    } else if (this.#moveBackward && !this.#moveForward) {
      moved = true;
      this.#nativeCamera.translateZ(this.#movementSpeed);
    }
    // 左右移动
    if (this.#moveLeft && !this.#moveRight) {
      moved = true;
      this.#nativeCamera.translateX(-this.#movementSpeed);
    } else if (this.#moveRight && !this.#moveLeft) {
      moved = true;
      this.#nativeCamera.translateX(this.#movementSpeed);
    }
    // 上下移动
    if (this.#moveUp && !this.#moveDown) {
      moved = true;
      this.#nativeCamera.translateY(this.#movementSpeed);
    } else if (this.#moveDown && !this.#moveUp) {
      moved = true;
      this.#nativeCamera.translateY(-this.#movementSpeed);
    }
    if (moved)
      this.dispatchEvent({type: 'changed'});
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
    // 使用欧拉角旋转
    const euler = new Euler(0, 0, 0, 'YXZ');
    euler.setFromQuaternion(this.#nativeCamera.quaternion);
    euler.y -= movementX * this.#lookSpeed;
    euler.x -= movementY * this.#lookSpeed;
    euler.x = MathUtils.clamp(euler.x, -Math.PI / 2, Math.PI / 2);
    this.#nativeCamera.quaternion.setFromEuler(euler);
    this.dispatchEvent({type: 'changed'});
  }

  /**
   * 鼠标锁定/解锁事件
   * @private
   */
  #pointerLockChange() {
    if (this.#canvasElement.ownerDocument.pointerLockElement === this.#canvasElement) {
      this.dispatchEvent({type: 'lock'});
      this.#isLocked = true;
    } else {
      this.dispatchEvent({type: 'unlock'});
      this.#isLocked = false;
    }
  }

  /**
   * 鼠标锁定失败事件
   */
  #pointerLockError() {
    console.error('无法使用Pointer Lock API');
  }
}
import {EventDispatcher, PerspectiveCamera} from 'three';
import {getDomAspect} from '../shared';
import type {SimpleChangedEvent} from './types';

export default class PerspectiveCameraHelper extends EventDispatcher<SimpleChangedEvent> {
  public readonly camera: PerspectiveCamera;
  readonly #resizeObserver?: ResizeObserver;

  constructor(dom: HTMLElement, ...args: ConstructorParameters<typeof PerspectiveCamera>) {
    super();
    const params = [...args];
    let useDefaultAspect = false;
    if (params.length < 2 || (params.length >= 2 && (params[1] == null))) {
      useDefaultAspect = true;
      params[1] = getDomAspect(dom);
    }
    this.camera = new PerspectiveCamera(...params);
    if (useDefaultAspect) {
      this.#resizeObserver = new ResizeObserver(() => {
        const aspect = getDomAspect(dom);
        if (aspect !== this.camera.aspect) {
          this.camera.aspect = aspect;
          this.camera.updateProjectionMatrix();
          this.dispatchEvent({type: 'changed'});
        }
      });
      this.#resizeObserver.observe(dom);
    }
  }

  /**
   * 释放资源
   */
  dispose() {
    this.#resizeObserver?.disconnect();
  }
}
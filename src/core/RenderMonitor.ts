import {WebGLRenderer} from 'three';

export class RenderMonitor {
  // 私有变量
  #renderer: WebGLRenderer;
  #lastFrameCount: number;
  #lastTime: number;
  #animationFrameId: number | null = null;

  // DOM 元素
  #dom!: HTMLDivElement;
  #fpsDiv!: HTMLDivElement;
  #infoDiv!: HTMLDivElement;

  constructor(renderer: WebGLRenderer) {
    this.#renderer = renderer;
    this.#lastFrameCount = renderer.info.render.frame;
    this.#lastTime = performance.now();

    // 初始化 UI 面板
    this.#initDOM();

    // 启动监控
    this.start();
  }

  #initDOM(): void {
    this.#dom = document.createElement('div');
    this.#dom.style.cssText = `
        position: fixed;
        top: 0;
        right: 0;
        opacity: 0.9;
        background-color: #000;
        color: #0f0;
        font-family: Helvetica, Arial, sans-serif;
        font-size: 12px;
        font-weight: bold;
        line-height: 1.2;
        padding: 5px;
        min-width: 120px;
        border-bottom-right-radius: 5px;
    `;

    this.#fpsDiv = document.createElement('div');
    this.#fpsDiv.style.fontSize = '14px';
    this.#fpsDiv.style.marginBottom = '3px';
    this.#dom.appendChild(this.#fpsDiv);

    this.#infoDiv = document.createElement('div');
    this.#infoDiv.style.color = '#0aa'; // 青色显示 Draw calls
    this.#dom.appendChild(this.#infoDiv);

    this.#renderer.domElement.parentElement!.appendChild(this.#dom);
  }

  // 使用箭头函数保留 this 指向
  #update = () => {
    const currentTime: number = performance.now();
    const deltaTime: number = currentTime - this.#lastTime;

    // 每 1000 毫秒（1秒）更新一次面板
    if (deltaTime >= 1000) {
      const currentFrameCount: number = this.#renderer.info.render.frame;

      // 计算过去 1 秒内，真实增加的帧数
      const frameDelta: number = currentFrameCount - this.#lastFrameCount;

      // 容错计算：确保根据真实的时间差计算 FPS
      const actualFps: number = Math.round((frameDelta * 1000) / deltaTime);

      // 更新面板显示
      if (actualFps > 0) {
        this.#fpsDiv.innerText = `Render FPS: ${actualFps}`;
        this.#fpsDiv.style.color = '#0f0'; // 有渲染时显示绿色
      } else {
        this.#fpsDiv.innerText = `Render FPS: 0 (Idle)`;
        this.#fpsDiv.style.color = '#f00'; // 闲置时显示红色
      }

      // 更新 DrawCalls 和 三角形面数
      this.#infoDiv.innerHTML = `
          DrawCalls: ${this.#renderer.info.render.calls}<br>
          Triangles: ${this.#renderer.info.render.triangles}
      `;

      // 重置计数器
      this.#lastFrameCount = currentFrameCount;
      this.#lastTime = currentTime;
    }

    // 继续循环更新面板
    this.#animationFrameId = requestAnimationFrame(this.#update);
  }

  /**
   * 启动监控
   */
  public start(): void {
    if (this.#animationFrameId === null) {
      this.#lastTime = performance.now();
      this.#lastFrameCount = this.#renderer.info.render.frame;
      this.#update();
    }
  }

  /**
   * 停止监控
   */
  public stop(): void {
    if (this.#animationFrameId !== null) {
      cancelAnimationFrame(this.#animationFrameId);
      this.#animationFrameId = null;
    }
  }

  /**
   * 销毁组件
   */
  public dispose(): void {
    this.stop();
    if (this.#dom && this.#dom.parentNode) {
      this.#dom.parentNode.removeChild(this.#dom);
    }
  }
}
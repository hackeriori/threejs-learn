import {type Loader, type Mesh, type Object3D, type WebGLRenderer} from "three";

/**
 * 获取元素的宽高，考虑缩放
 * @param dom dom元素
 */
export function getDomSize(dom: HTMLElement) {
  // 使用getBoundingClientRect获取带小数点的宽高。
  const rect = dom.getBoundingClientRect();
  return {
    width: Math.round(rect.width * window.devicePixelRatio),
    height: Math.round(rect.height * window.devicePixelRatio)
  };
}

/**
 * 获取元素的宽高比
 * @param dom dom元素
 */
export function getDomAspect(dom: HTMLElement) {
  // 使用getBoundingClientRect获取带小数点的宽高。
  const rect = dom.getBoundingClientRect();
  return rect.width / rect.height;
}

/**
 * 将mesh的中心点对齐到坐标原点(0, 0, 0)
 * @param mesh
 */
export function putMeshToItsCenter(mesh: Mesh) {
  // 计算出边界框
  mesh.geometry.computeBoundingBox();
  // 将边界框的中心点给mesh的位置，multiplyScalar(-1)对mesh.position各坐标乘以-1，使其位置反向移动到取反后的坐标上，这样做的目的是为了将geometry的中心对齐到坐标原点(0,0,0)，
  // 注意整个操作并没有改变文字的中心点，只是将位置挪动使得中心点对齐原点。
  mesh.geometry.boundingBox?.getCenter(mesh.position).multiplyScalar(-1);
}

/**
 * 获取元素代表的裁剪区
 * @param element
 */
export function getScissorForElement(element: HTMLElement): [number, number, number, number] {
  const elementRect = element.getBoundingClientRect();
  return [elementRect.left, elementRect.top, elementRect.width, elementRect.height];
}

/**
 * 将裁剪区参数应用到renderer上，renderer必须setScissorTest为true
 * @param renderer
 * @param scissor
 */
export function appScissorForRender(renderer: WebGLRenderer, scissor: [number, number, number, number]) {
  renderer.setScissor(...scissor);
  renderer.setViewport(...scissor);
}

/**
 * 获取带类型的用户自定义数据
 * @param object
 */
export function getObjectUserData<T>(object: Object3D) {
  return object.userData as T;
}

/**
 * 尝试加载资源
 * @param loader TextureLoader
 * @param url 资源路径
 */
export async function tryLoad<TData>(loader: Loader<TData>, url: string) {
  try {
    return await loader.loadAsync(url);
  } catch {
    console.warn(`Failed to load: ${url}`);
  }
}
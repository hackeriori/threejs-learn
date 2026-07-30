import {
  createRouter,
  createWebHashHistory,
  type LocationQuery,
  type RouteParamsGeneric,
  type RouteRecordRaw
} from 'vue-router';

declare module 'vue-router' {
  interface RouteMeta extends Record<PropertyKey, unknown> {
    // 是否在路由列表中展示
    showInList?: boolean,
    // 页面标题
    title?: string,
    // 开发模式主动传递给页面的query
    query?: LocationQuery,
    // 开发阶段主动传递给页面的params
    params?: RouteParamsGeneric
  }
}

/* eslint-disable @typescript-eslint/promise-function-async */
export const routes: RouteRecordRaw[] = [
  {
    path: '/HelloWorld',
    name: 'HelloWorld',
    component: () => import('./views/HelloWorld.vue')
  },
  {
    path: '/Axis',
    name: '坐标轴',
    component: () => import('./views/Axis.vue')
  },
  {
    path: '/FirstPerson',
    name: '第一人称视角控制',
    component: () => import('./views/controls/FirstPerson.vue')
  },
  {
    path: '/MapControl',
    name: '地图控制',
    component: () => import('./views/controls/MapControl.vue')
  },
  {
    path: '/RouteCamera',
    name: '相机旋转',
    component: () => import('./views/camera/RouteCamera.vue')
  },
  {
    path: '/LocalPosition',
    name: '局部坐标',
    component: () => import('./views/LocalPosition.vue')
  },
  {
    path: '/BufferGeometry',
    name: '缓冲几何体',
    component: () => import('./views/geometry/BufferGeometry.vue')
  },
  {
    path: '/ExtrudeGeometry',
    name: '挤压（凸出）缓冲几何体',
    component: () => import('./views/geometry/ExtrudeGeometry.vue')
  },
  {
    path: '/ChineseFont',
    name: '中文字体',
    component: () => import('./views/geometry/ChineseFont.vue')
  },
  {
    path: '/LineAndPoint',
    name: '线段和点',
    component: () => import('./views/geometry/LineAndPoint.vue')
  },
  {
    path: '/DepthTest',
    name: '深度检测',
    component: () => import('./views/DepthTest.vue')
  },
  {
    path: '/RenderOnDemand',
    name: '按需渲染',
    component: () => import('./views/RenderOnDemand.vue')
  },
  {
    path: '/ImageTexture',
    name: '图片纹理',
    component: () => import('./views/texture/ImageTexture.vue')
  },
  {
    path: '/LightExamples',
    name: '光照',
    component: () => import('./views/light/LightExamples.vue')
  },
  {
    path: '/CameraHelper',
    name: '相机姿态观察器',
    component: () => import('./views/camera/CameraHelper.vue')
  },
  {
    path: '/NormalShadow',
    name: '普通阴影',
    component: () => import('./views/shadow/NormalShadow.vue')
  },
  {
    path: '/FakeShadow',
    name: '假阴影',
    component: () => import('./views/shadow/FakeShadow.vue')
  }
];

if (import.meta.env.DEV) {
  routes.push({
    path: '/',
    name: '导航页',
    meta: {
      showInList: false
    },
    component: () => import('./ViewSelector.vue')
  });
  const verifyRouter = [...routes];
  for (let i = routes.length - 1; i >= 0; i--) {
    const indexRouter = verifyRouter[i];
    verifyRouter.pop();
    if (verifyRouter.findIndex(x => x.name === indexRouter.name || x.path === indexRouter.path) > -1)
      alert(`路由名称或路径重复，name：${indexRouter.name as string}，path：${indexRouter.path}`);
  }
}

const router = createRouter({
  routes,
  history: createWebHashHistory()
});

router.beforeEach((to) => {
  if (typeof to.meta.title === 'string')
    document.title = to.meta.title;
   else if (typeof to.name === 'string')
    document.title = to.name;
});

export default router;

import { createVNode } from "./vnode"


// 创建app 并且挂在到container上面
export function createAppAPI(render) {
  return function createApp(rootComponent, rootProps) {
    const app = {
      _props: rootProps,
      _component: rootComponent,
      _container: null,
      mount(container) { // 挂载
        // 根据组件创建虚拟节点
        const vnode = createVNode(rootComponent, rootProps)

        // 将虚拟节点和容器获取后调用render方法进行渲染
        render(vnode, container)

        app._container = container
      }
    }
    return app
  }
}

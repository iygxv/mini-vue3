import { effect } from '@vue/reactivity'
import { ShapeFlags } from '@vue/shared'
import { createAppAPI } from './apiCreateApp'
import { createComponentInstance, setupComponent } from './component'
import { queueJob } from './scheduler'
import { normalizeVNode, TEXT } from './vnode'

// 渲染
export function createRender(renderOptions) {
  // 创建一个effect, 让render函数执行
  const setupRenderEffect = (instance, container) => {
    // 调用render方法, 在effect中调用收集依赖和触发依赖, 数据改变时会重新渲染
    instance.update = effect(
      function componentEffect() {
        // 每个组件都有一个effect, vue3是组件级更新
        if (!instance.isMounted) {
          let { bm, m } = instance
          // 挂载之前
          if (bm) {
            // invokeArrayFns(bm)
          }
          // 没有被挂载, 初始渲染(渲染)
          let ProxyToUse = instance.proxy
          let subTree = (instance.subTree = instance.render!.call(ProxyToUse, ProxyToUse))
          // patch(null, subTree, container)
          instance.isMounted = true
          // 挂载完毕
          if (m) {
            // invokeArrayFns(m)
          }
        } else {
          let { bu, u } = instance
          if (bu) {
            // invokeArrayFns(bu)
          }
          // 更新(diff算法)
          // 上一次的tree
          let prevTree = instance.subTree
          // 获取到更新的tree
          let ProxyToUse = instance.proxy
          let nextTree = instance.render!.call(ProxyToUse, ProxyToUse)

          patch(prevTree, nextTree, container)
          if (u) {
            // invokeArrayFns(u)
          }
        }
      },
      {
        scheduler: queueJob
      }
    )
  }
  // 挂载组件
  const mountComponent = (initialVNode, container) => {
    // 调用setup拿到返回值
    // 1.0创建实例
    const instance = (initialVNode.component = createComponentInstance(initialVNode))
    // 2.0将数据解析到实例上
    setupComponent(instance)
    // 3.0创建一个effect, 让render函数执行
    setupRenderEffect(instance, container)
  }

  // 处理组件
  const processComponent = (n1, n2, container) => {
    if (n1 == null) {
      // 组件没有上一次虚拟节点(挂载)
      mountComponent(n2, container)
    } else {
      // 更新
    }
  }
   /**
   * patch俩个作用(一个是挂载新节点, 一个是是更新节点)
   * @param n1  旧节点
   * @param n2  新节点
   * @param container  容易
   * @param anchor  参照物
   */
    const patch = (n1, n2, container, anchor = null) => {
      // console.log(n2);
      
      // 针对不同类型, 做初始化操作
      const { shapeFlag, type } = n2
      
      // 判断n1,n2 节点的type和key
      // if (n1 && !isSameVNodeType(n1, n2)) {
      //   // 节点类型不一样, 删除旧的 添加新的
      //   anchor = hostNextSibling(n1.el) // 参照物(n1的下一个兄弟元素)
      //   unmount(n1) // 删除n1元素
      // }
      // 处理不同类型
      switch (type) {
        case TEXT:
          // 处理文本
          // ProcessText(n1, n2, container, anchor)
          break
        default:
          if (shapeFlag & ShapeFlags.ELEMENT) {
            // 处理元素
            // processElement(n1, n2, container, anchor)
          } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
            // 处理组件
            processComponent(n1, n2, container)
          }
      }
    }
  // 渲染核心
  const render = (vnode, container) => {
    // core的核心, 根据不同的虚拟节点,创建对应的真实元素
    patch(null, vnode, container)
  }
  return {
    createApp: createAppAPI(render)
  }
}
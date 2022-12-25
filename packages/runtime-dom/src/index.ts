import { createRender, h } from '@vue/runtime-core'  // 创建渲染的方法
import { nodeOps } from './nodeOps' // 节点操作
import { patchProp } from './patchProp' // 属性操作

import { extend } from '@vue/shared' // 工具方法

// 渲染时用到的所有方法(俩这结合)
const renderOptions = extend({ patchProp }, nodeOps)

// vue中runtime-core提供了核心的方法, 用来处理渲染, 他会使用runtime-dom中的api进行渲染
export function createApp(rootComponent, rootProps = null) {
  const app = createRender(renderOptions).createApp(rootComponent, rootProps) // 创建app还是通过这个createApp这实现的
  let { mount } = app // 真正的挂载方法
  app.mount = function(container) {
    // 清空容器的操作
    container = nodeOps.querySelector(container)
    container.innerHTML = ``
    // 将组件 渲染成dom元素, 进行挂载
    mount(container)
  }
  console.log(app);
  
  return app;
}

export * from '@vue/runtime-core' 
export * from '@vue/reactivity' 

// 用户调用的是runtime-dom -> runtime-core
// runtime-dom 是为了解决平台差异的(浏览器)
// 组件相关
import { isFunction, ShapeFlags } from '@vue/shared'
import { PublicInstanceProxyHandlers } from './componentPublicInstanceProxy'

// 创建实例
export function createComponentInstance(vnode) {
  // 组件实例(有属性, 插槽...)
  const instance = {
    vnode,
    type: vnode.type,
    props: {a: 1},
    attrs: {},
    slots: {},
    ctx: {},
    render: null, // 渲染函数
    // vue2的属性不做考虑
    setupState: {}, // setup返回一个对象,这个对象作为setupState
    isMounted: false // 是否挂载过
  }
  instance.ctx = { _: instance } // 做代理
  // console.log(instance);
  
  return instance
}
export let currentInstance = null
// 设置实例
export let setCurrentInstance = (instance) => {
  currentInstance = instance
}
// 获取实例
export let getCurrentInstance = () => { // 在setup获取当前实例
   return currentInstance
}
// 将数据解析到实例上
export function setupComponent(instance) {
  const { props, children } = instance.vnode
  // 根据props解析出props 和attrs 将其放到instance上
  props && (instance.props = props ) // 会优先组件props, 然后再到实例的props
  children && (instance.children = children)

  // 判断是否有状态的组件: 函数组件
  let isStateful = instance.vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT
  if (isStateful) {
    // 调用, 当前实例的setup方法
    setupStatefulComponent(instance)
  }
}
// 调用当前实例的setup方法
function setupStatefulComponent(instance) {
  // 代理
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers as any)
  let Component = instance.type
  let { setup } = Component
  // 如果setup函数
  if (setup) {
    currentInstance = instance
    let setupContext = createSetupContext(instance)
    const setupResult = setup(instance.props, setupContext)
    currentInstance = null
    handleSetupResult(instance, setupResult)
    // 调用render方法进行渲染
  }else {
    // 完成组件的启动
    finishComponentSetup(instance)
  }
}
// 处理setup返回结果
function handleSetupResult(instance, setupResult) {
  // 如果setup返回函数,就认为他是render函数
   if(isFunction(setupResult)) {
     instance.render = setupResult
   }else {
    // setup返回的是对象, 就将值赋值给instance.setupState
     instance.setupState = setupResult
   }
   finishComponentSetup(instance)
}
// 完成组件的启动
function finishComponentSetup(instance) {
  let Component = instance.type // 获取到组件
  if(!instance.render) { // 组件中没有render函数
    // 对模板进行编译, 产生render函数
    if(!Component.render && Component.template) {
      // 进行编译, 解析出render函数
    }
    // 组件上有render
    instance.render = Component.render // 将生成的render函数放在实例上
  }
}
// 上下文对象
function createSetupContext(instance) {
  return {
    attrs: instance.attrs,
    // props: instance.props,  // 生产环境没有
    slots: instance.slots,
    emit: () => {},
    expose: () => {}
  }
}

// instance 表示组件的各种信息
// context 就4个参数, 开发时使用
// props 组件中的属性

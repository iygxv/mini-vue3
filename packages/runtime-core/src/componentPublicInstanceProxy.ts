import { hasOwn } from '@vue/shared'


// let App = {
//   render(proxy) {
//     使用代理可以直接访问到这个属性
//     console.log(proxy.a, proxy.c);
    
//   }
// }
/**
 * 代理
 */
export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    if(key[0] == '$') {
      return; // 不能访问$开头的变量
    }
    // 取值时访问setupState, props...
    const { setupState, props } = instance
    if (hasOwn(setupState, key)) {
      return setupState[key]
    } else if (hasOwn(props, key)) {
      return props[key]
    } else {
      return undefined
    }
  },
  set({ _: instance }, key, value) {
    const { setupState, props } = instance
    if (hasOwn(setupState, key)) {
      setupState[key] = value
    } else if (hasOwn(props, key)) {
      props[key] = value
    }
    return true
  }
}


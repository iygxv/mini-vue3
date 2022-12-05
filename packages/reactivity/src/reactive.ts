import { isObject } from '../../shared/src/index';
// reactive 有四种形式 reactive, shallowReactive, readonly, shallowReadonly

import {
  mutableHandlers, 
  shallowReactiveHandlers, 
  readonlyHandlers,
  shallowReadonlyHandlers
} from './baseHandlers'

// 基本reactive
export function reactive(target) {
  return createReactiveObject(target, false, mutableHandlers)
}
// 浅reactive
export function shallowReactive(target) {
   return createReactiveObject(target, false, shallowReactiveHandlers)
}
// 只读reactive
export function readonly(target) {
   return createReactiveObject(target, true, readonlyHandlers)
}
// 浅只读reactive
export function shallowReadonly(target) {
   return createReactiveObject(target, true, shallowReadonlyHandlers)
}

export const reactiveMap = new WeakMap()
export const readonlyMap = new WeakMap()

// 函数柯里化思想
/**
 * 
 * @param target 目标对象
 * @param isReadonly 是否只读
 * @param baseHandlers proxy handlers (核心)
 */
function createReactiveObject(target, isReadonly, baseHandlers) {
  // 1.proxy 只接受对象为为参数
  if(!isObject(target)) {
    console.warn(`value cannot be made reactive: ${String(target)}`)
    return target
  }

  // 2.进行存储, 多次用proxy处理, 返回第一次处理情况
  const proxyMap = isReadonly ? readonlyMap : reactiveMap
  const existingProxy = proxyMap.get(target)
  // 如果存储中有
  if(existingProxy) {
    return existingProxy
  }

  const proxy = new Proxy(target, baseHandlers)
  // 存储
  proxyMap.set(target, proxy)
  return proxy
}
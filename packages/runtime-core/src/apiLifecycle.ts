import { currentInstance, setCurrentInstance } from './component'
// 标识
export const enum LifecycleHooks {
  BEFORE_CREATE = 'bc',
  CREATED = 'c',
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  BEFORE_UPDATE = 'bu',
  UPDATED = 'u',
  BEFORE_UNMOUNT = 'bum',
  UNMOUNTED = 'um',
  DEACTIVATED = 'da',
  ACTIVATED = 'a',
  RENDER_TRIGGERED = 'rtg',
  RENDER_TRACKED = 'rtc',
  ERROR_CAPTURED = 'ec',
  SERVER_PREFETCH = 'sp'
}
const injectHook = (type, hook, target) => {
  if (!target) {
    console.warn(`inject() can only be used inside setup().`)
  } else {
    const hooks = target[type] || (target[type] = []) // instance.bm = []
    const wrap = () => {
      setCurrentInstance(target)
      hook.call(target)
      setCurrentInstance(null)
    }
    hooks.push(wrap)
  }
}
const createHook =
  (lifecycle) =>
  (hook, target = currentInstance) => {
    // target 标识是哪个函数

    // 给当前实例增加响应的生命周期
    injectHook(lifecycle, hook, target)
  }

// 执行所有的hooks
export const invokeArrayFns = (fns) => {
  fns.forEach((fn) => fn())
}

// 生成生命周期api
export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT)
export const onMounted = createHook(LifecycleHooks.MOUNTED)
export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE)
export const onUpdated = createHook(LifecycleHooks.UPDATED)
export const onBeforeUnmount = createHook(LifecycleHooks.BEFORE_UNMOUNT)
export const onUnmounted = createHook(LifecycleHooks.UNMOUNTED)

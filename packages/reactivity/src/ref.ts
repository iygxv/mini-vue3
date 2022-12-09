import { hasChanged, isObject } from "@vue/shared"
import { track, trigger } from "./effect"
import { trackOpTypes, TriggerOrTypes } from "./operators"
import { reactive } from "./reactive"

// 转reactive
export const toReactive = <T extends unknown>(value: T): T => isObject(value) ? reactive(value) : value

export function isRef(r) {
  // 判断是否已经ref过了
  return !!(r && r.__v_isRef === true)
}


export function ref(value) {
  return createRef(value)
}
export function shallowRef(value) {
  return createRef(value, true)
}

/**
 * 创建ref实例
 * @param rawValue 原始的值 
 * @param shallow 是否浅的
 */
function createRef(rawValue, shallow = false) {
  if (isRef(rawValue)) {
    return rawValue
  }
  return new RefImpl(rawValue, shallow)
}

class RefImpl {
  private _value // 私有的值
  private _rawValue // 私有的原始值
  public readonly __v_isRef = true
  constructor(value, public readonly __v_isShallow: boolean) {
    this._rawValue = value
    this._value = __v_isShallow ? value : toReactive(value)
  }

  // 代理
  get value() {
    // 收集依赖
    track(this, trackOpTypes.GET, 'value')
    return this._value
  }
  set value(newVal) {
    if(hasChanged(newVal, this._rawValue)) {
       this._rawValue = newVal
       this._value =  this.__v_isShallow ? newVal : toReactive(newVal)
       // 触发依赖
       trigger(this, TriggerOrTypes.SET, 'value', newVal)
    }
  }
}
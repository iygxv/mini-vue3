import { isFunction } from '../../shared/src/index';
import { effect, track, trigger } from './effect';
import { trackOpTypes, TriggerOrTypes } from './operators';



class ComputedRefImpl {
  public _dirty = true // 默认为true (是否惰性求值, _dirty为true就拿出新值, _dirty为false不求值)
  public _value
  public effect
  constructor(getter, public setter) {
    // effect可以收集依赖和触发依赖,
    this.effect = effect(getter, {
      lazy: true,
      scheduler: () => {
        if (!this._dirty) {
          this._dirty = true
          // 触发一次更新,因为在依赖的值变化后, 需要更新内容
          trigger(this, TriggerOrTypes.SET, 'value')
        }
      }
    })
  }
  get value() {
    // 如果是脏的, 我们采取执行effect, 也就是执行用户传过来的函数,并且将返回值给到this._value
    if (this._dirty) {
      /**
       * this.effect会收集相关依赖的,例如：
       * const name = ref('vvv')
       *  computed(() => name.value)
       *  这里会收集到name的依赖， 如果name变化会触发effect下的scheduler函数
       */
      this._value = this.effect()// 会将用户返回的值返回
      this._dirty = false
    }
   /**
    * 这里是收集收集使用computed 中 .value的依赖, 例如:
    * const name = ref('vvv')
    * const myName = computed(() => name.value)
    * computed(() => myName.value) // 收集的里面value的依赖
    */
    track(this, trackOpTypes.GET, 'value')
    return this._value
  }
  set value(newVal) {
    this.setter(newVal)
  }
}

/**
 * computed
 * @param getterOrOptions  getter函数或者 options配置
 * @returns ComputedRefImpl实例
 */
export function computed(getterOrOptions) {
  let getter
  let setter

  // 如果传过来的只是一个函数
  const onlyGetter = isFunction(getterOrOptions)
  if (onlyGetter) {
    getter = getterOrOptions
    // setter就会警告⚠️
    setter = () => {
      console.warn('Write operation failed: computed value is readonly')
    }
  } else {
    // 要求
    // computed({
    //   get() {},
    //   set() {}
    // })
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }
  const cRef = new ComputedRefImpl(getter, setter)
  return cRef
}
/**
 * 核心原理
 * effect每次依赖的响应式值变化,就会触发一次effect重新运行
 * 举例子说明:
 * effect(() => state.name)
 * 上面这段代码 使用了effect,其参数是用户的一个自定义函数, 函数中使用了 state.name
 * 这时候就会get拦截,我们只要在拦截的时候track()依赖收集一下,等待更新的时候, 我们在触发依赖
 * setTimeout(() => state.name = '666', 1000)
 * 1秒后, state.name被改为666, 触发set进行拦截, 我们值需要把trigger()依赖触发一下, 重新调用一下effect
 * 这时候就会重新去执行用户的自定义函数
 * 
 * 后话: 其实感觉这里抓住了拦截的时候, 然后进行一些操作
 */

import { isArray, isIntegerKey } from "@vue/shared"
import { TriggerOrTypes } from "./operators"


/**
 *
 * @param fn 用户自定义的函数,例如: effect(() => 123)
 * @param options 配置选项 ,例如: effect(() => 123, {lazy: true})
 */
export function effect(fn, options: any = {}) {
  // 让effect变成响应式, 可以做到数据变化重新执行
  const effect = createReactiveEffect(fn, options)
  if (!options.lazy) {
    effect()
  }
  return effect
}

let uid = 0
let activeEffect // 存储当前的effect(暴露effect给外面函数使用)
let effectStack = [] // 存储当前effect
function createReactiveEffect(fn, options) {
  const effect = function reactiveEffect() {
    if (!effectStack.includes(effect)) {
      try {
        // 进栈
        effectStack.push(effect)
        activeEffect = effect
        return fn() // 执行用户传过来的函数 -- 函数会去取到值, 触发get
      } finally {
        // 无论结果怎么样
        effectStack.pop()
        activeEffect = effectStack[effectStack.length - 1]
      }
    }

  }
  effect.id = uid++ // 制作effect标识
  effect._isEffect = true // 用于标识这个是响应式effect
  effect.raw = fn // 保留原fn
  effect.options = options // 保存options选项
  return effect
}

// 收集当前target对应的effect函数
const targetMap = new WeakMap()

// 收集依赖(effect)
export function track(target, type, key) {

  // 当前没有当前effect
  if (!activeEffect) return
  // 是否已经收集过了
  let depsMap = targetMap.get(target)
  // 没有收集过才起去收集
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map))
  }
  // 是否已经收集过了该对象属性了
  let dep = depsMap.get(key)
  if (!dep) {
    // set结构防止重复
    depsMap.set(key, (dep = new Set))
  }
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect)
  }
  // console.log(targetMap);

}

// 触发依赖(effect())
export function trigger(target, type, key, value, oldVal?) {
  console.log(target, type, key, value, oldVal);

  // 如果这个对象没有收集过effect
  const depsMap = targetMap.get(target)
  if (!depsMap) return;

  // 将所以要执行的effect 全部存储到一个集合中, 最终一起执行
  const effects = new Set() // 优点: 去重

  const add = (effectsToAdd) => {
    if (effectsToAdd) {
      effectsToAdd.forEach((effect) => {
        effects.add(effect) // forEach 循环加入 effect
      })
    }
  }
  console.log(depsMap)
  // 特殊处理
  if (key === 'length' && isArray(target)) {
    
    
    // 如果对应的长度, 有依赖收集需要更新
    depsMap.forEach((dep, key) => {
      console.log('key:' +key);
      console.log('value:' + value);
      /**
       * value => 更改的长度(newValue)
       * key => 数组的长度
       * 更改的长度小于数组的长度才会触发依赖添加
       * 例如: effect(() => state.arr.length)   总state.arr.length = 3
       * 下面对state.arr.length进行修改 => state.arr.length = 10
       * 更改的长度大于数组的长度  => 不进行依赖触发
       * 
       * 下面对state.arr.length进行修改 => state.arr.length = 2
       * 更改的长度小于数组的长度 => 进行依赖触发
       */
      if (key === 'length' || key > value) { // 更改的长度小于索引
        add(dep)
      }
    })
  } else {
    if (key != undefined) {
      
      // 获取到depsMap.get(key)里面的
      add(depsMap.get(key))
    }
    /**
     * 如果是新增, 但是在effect并没有收集到arr.length的依赖就没必要出触发更新了
     * 例如: effect(() => state.arr[2]) 
     * 然后 state.arr[10] = 10  => 这种其实是收集length
     */
    switch(type) {
      case TriggerOrTypes.ADD:
        // console.log('key:' +key);
        // 新的索引添加到数组中 => length变化
        if(isArray(target) && isIntegerKey(key)) {
          add(depsMap.get('length'))
        }
   }
  }  
  effects.forEach((effect: any) => {
    if (effect.options.scheduler) {
      effect.options.scheduler()
    } else {
      effect()
    }
  })
}



// 通过栈includes来判断是否已经将这个依赖加入栈中了, 来解决这个问题
// effect(() => {
//   state.age ++
// })

// 函数调用是栈型结构(通过入栈 和 出栈, 保留对effect的一致)
// effect(()=> {
//   state.name  // effect1
//   effect(()=> {
//     state.name // effect2
//   })
//   state.age // effect1
// })

/**
 * 数组的情况 => 索引 | length
 * 新增: 索引 >= arr.length 触发的是length的变化
 * 修改: 索引 < arr.length 
 * 
 * 更改的长度小于数组的长度才会触发依赖添加 key < newLength
 */
// 举例
// h('div', {onClick:function() {console.log('on')}})
export function patchEvent(el, key, nextValue) {
  // 对函数的缓存 => _vei存储列表
  const invokers = el._vei || (el._vei = {})

  const exists = invokers[key] // 判断缓存中是否有这个事件相对应的函数

  if (nextValue && exists) { // 绑定的事件还存在
    // 事件重复, 直接去找对应事件
    exists.value = nextValue
  } else {
    const eventName = key.slice(2).toLowerCase() // 举例中click
    if (nextValue) {
      let invoker =  invokers[eventName] = createInvoker(nextValue) // {click: fn} 一一对应
      el.addEventListener(eventName, invoker) 
    } else {
      el.removeEventListener(eventName, exists)
      invokers[eventName] = undefined // 移除了之后
    }
  }
}
function createInvoker(value) {
  const invoker = (e) => {
    invoker.value(e)
  }
  invoker.value = value
  return invoker
}

/**
 * 解释说明:
 * 例如:
 * <div @click="fn"></div>
 * 后面变成
 * <div @click="fn1"></div>
 * 
 * 办法: 替换
 * 我们先创建一个存在的函数 value = fn, 在下次函数变化的时候 value = fn1就好
 */
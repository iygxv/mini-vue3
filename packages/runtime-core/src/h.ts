import { isObject } from '@vue/shared'
import { createVNode, isVnode } from './vnode'

// h函数
// h的写法
// h('div', {})
// h('div', 'hello') / h('div', h('div))
// h('div', {}, 'hello')
// h('div', {}, [h('p', {}), 'span'])
// h('div', {}, p, span)
export function h(type, propsOrChildren, children) {
  const l = arguments.length
  if (l === 2) {
    // 类型 + 属性 / 类型 + 孩子
    // 如果第二个参数不是对象
    if (isObject(propsOrChildren)) {
      // 对象
      if (isVnode(propsOrChildren)) {
        // h('div', h('div'))
        return createVNode(type, null, [propsOrChildren])
      }
      return createVNode(type, propsOrChildren)
    } else {
      // 孩子
      return createVNode(type, null, propsOrChildren)
    }
  } else {
    if (l > 3) {
      children = Array.prototype.slice.call(arguments, 2)
    } else if (l === 3 && isVnode(children)) {
      children = [children]
    }
    return createVNode(type, propsOrChildren, children)
  }
}
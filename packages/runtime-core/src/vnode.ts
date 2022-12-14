import { isArray, isObject, isString, ShapeFlags } from "@vue/shared"

export const isVnode = (vnode) =>  vnode.__v_isVnode
/**
 * 创建虚拟节点
 * @param type 根据类型判断组件还是普通元素
 * @param props 组件props(并不是实例props)
 */
export function createVNode(type, props, children = null ) {
  const shapeFlag = isString(type) ? ShapeFlags.ELEMENT : isObject(type)? ShapeFlags.STATEFUL_COMPONENT : 0
  // 一个对象来描述相对应的内容, 虚拟节点有跨平台的能力
   const vnode = {
     __v_isVnode: true, // 表示vnode节点
     type,
     props,
     children,
     component: null, // 存放组件的实例
     el: null, // 真实节点
     key: props && props.key, // diff会用到key
     shapeFlag,
   }
   // 判断儿子类型
   normalizeChildren(vnode, children)
   return vnode
}
// 判断儿子类型
function normalizeChildren(vnode, children) {
    let type = 0
    if(children == null) {}
    if(isArray(children)) {
      type = ShapeFlags.ARRAY_CHILDREN
    }else {
      type = ShapeFlags.TEXT_CHILDREN
    }
    vnode.shapeFlag = vnode.shapeFlag | type

}

// 判断文本类型
export const TEXT = Symbol('Text')
export function normalizeVNode(child) {
  if(isObject(child)) return child
  return createVNode(TEXT, null, String(child))
}
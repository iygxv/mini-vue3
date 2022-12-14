// 节点相关操作
const doc = (typeof document !== 'undefined' ? document : null)
export const nodeOps = {
  // 创建元素
  createElement: (tag) => doc.createElement(tag),
  // 删除元素
  remove: child => {
    const parent = child.parentNode
    if(parent) {
      parent.removeChild(child)
    }
  },
  /**
   * 插入元素
   * @param child 插入的子节点
   * @param parent 父节点
   * @param anchor 参照物
   */
  insert: (child, parent, anchor = null) => {
    parent.insertBefore(child, anchor)
  },
  // 创建文本
  createText: text => doc.createTextNode(text),
  // 创建注释
  createComment: text => doc.createComment(text),
  // 设置文本
  setText: (node, text) => {
    node.nodeValue = text
  },
  // 设置元素文本
  setElementText: (el, text) => {
    el.textContent = text
  },
  // 父节点
  parentNode: node => node.parentNode,
  // 兄弟节点
  nextSibling: node => node.nextSibling,
  // 获取dom元素
  querySelector: selector => doc.querySelector(selector),
  // 设置id属性
  setScopeId(el, id) {
    el.setAttribute(id, '')
  },
  // 克隆节点
  cloneNode(el) {
    const cloned = el.cloneNode(true)
    // if (`_value` in el) {
    //   ;(cloned as any)._value = (el as any)._value
    // }
    return cloned
  },
}
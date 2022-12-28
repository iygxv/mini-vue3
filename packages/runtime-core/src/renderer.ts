import { effect } from '@vue/reactivity'
import { ShapeFlags } from '@vue/shared'
import { createAppAPI } from './apiCreateApp'
import { invokeArrayFns } from './apiLifecycle'
import { createComponentInstance, setupComponent } from './component'
import { queueJob } from './scheduler'
import { normalizeVNode, TEXT } from './vnode'

// 创建渲染器, 肯定有一个render方法
export function createRender(renderOptions) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    createComment: hostCreateComment,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    setScopeId: hostSetScopeId = {},
    cloneNode: hostCloneNode,
    insertStaticContent: hostInsertStaticContent
  } = renderOptions
  // 判断是否相同节点
  const isSameVNodeType = (n1, n2) => {
    return n1.type === n2.type && n1.key === n2.key
  }
  // 卸载
  const unmount = (n1) => {
    hostRemove(n1.el)
  }
  // 卸载孩子节点
  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i])
    }
  }
  // 创建一个effect, 让render函数执行
  const setupRenderEffect = (instance, container) => {
    // 调用render方法, 在effect中调用收集依赖和触发依赖, 数据改变时会重新渲染
    instance.update = effect(
      function componentEffect() {
        // 每个组件都有一个effect, vue3是组件级更新
        if (!instance.isMounted) {
          let { bm, m } = instance
          // 挂载之前
          if (bm) {
            invokeArrayFns(bm)
          }
          // 没有被挂载, 初始渲染(渲染)
          let ProxyToUse = instance.proxy
          let subTree = (instance.subTree = instance.render!.call(ProxyToUse, ProxyToUse))
          patch(null, subTree, container)
          instance.isMounted = true
          // 挂载完毕
          if (m) {
            invokeArrayFns(m)
          }
          console.log('挂载了');
        } else {
          console.log('更新了');
          
          let { bu, u } = instance
          if (bu) {
            invokeArrayFns(bu)
          }
          // 更新(diff算法)
          // 上一次的tree
          let prevTree = instance.subTree
          // 获取到更新的tree
          let ProxyToUse = instance.proxy
          let nextTree = instance.render!.call(ProxyToUse, ProxyToUse)
          patch(prevTree, nextTree, container)
          if (u) {
            invokeArrayFns(u)
          }
        }
      },
      {
        scheduler: (effect) => queueJob(effect)
      }
    )
  }
  // 挂载组件
  const mountComponent = (initialVNode, container) => {
    // 调用setup拿到返回值
    // 1.0创建实例
    const instance = (initialVNode.component = createComponentInstance(initialVNode))
    // 2.0将数据解析到实例上
    setupComponent(instance)
    // 3.0创建一个effect, 让render函数执行
    setupRenderEffect(instance, container)
  }
  // 挂载孩子元素(递归处理)
  const mountChildren = (children, el) => {
    for (let i = 0; i < children.length; i++) {
      let child = normalizeVNode(children[i])
      patch(null, child, el)
    }
  }
  // 挂载元素
  const mountElement = (vnode, container, anchor = null) => {
    // 递归渲染
    const { props, shapeFlag, type, children } = vnode
    let el =(vnode.el = hostCreateElement(type))
    // 样式
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key])
      }
    }
    // 文本
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children)
    }
    // 数组文本
    if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el)
    }
    hostInsert(el, container, anchor)
  }
  // 核心diff(俩个数组对比)
  const patchKeyedChildren = (c1, c2, el) => {
    // 对特殊情况进行优化
    let i = 0 // 默认从头开始比对
    let e1 = c1.length - 1 // 获取旧节点最大索引
    let e2 = c2.length - 1 // 获取新节点最大索引

    //  1.有key的情况: 从头开始比对 i<e1 && i<e2, 遇到不同的就停止(开头相同)
    while (i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = c2[i]
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, el)
      } else {
        break
      }
      i++
    }
    // 2.有key的情况: 从尾开始比对 i<=e1 && i<=e2, 遇到不同的就停止(结尾相同)
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, el)
      } else {
        break
      }
      e1--
      e2--
    }
    // 3.有key情况下: 同序列加载 i>e1&& i<=e2
    if (i > e1) {
      // 3.1老的少 新的多(有一方完成比对了)
      if (i <= e2) {
        // 表示有新增的部分
        const nextPos = e2 + 1 // 参照物
        const anchor = nextPos < c2.length ? c2[nextPos].el : null
        while (i <= e2) {
          patch(null, c2[i], el, anchor)
        }
      }
    } else if (i > e2) {
      // 3.2老的多, 新的少
      //卸载旧的
      while (i <= e1) {
        unmount(c1[i]) // 删除老的元素
        i++
      }
    } else {
      // 乱序比较  -- 尽可能的复用旧节点
      // 双指针
      let s1 = i
      let s2 = i

      // vue3新节点作为映射表, vue2老节点作为映射表
      let keyToNewIndexMap = new Map()
      for (let i = s2; i <= e2; i++) {
        const childVNode = c2[i]
        keyToNewIndexMap.set(childVNode.key, i)
      }

      const toBePatched = e2 - s2 + 1 // 乱序中节点的个数
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0) // 用0补充 [0, 0, 0, 0] 0代表是没有被patch过的新节点
      // 去老的里面查找有没有复用的
      for (let i = s1; i <= el; i++) {
        const oldVNode = c1[i]
        let newIndex = keyToNewIndexMap.get(oldVNode.key)
        if (newIndex === undefined) {
          // 老的不在新的里面, 卸载
          unmount(oldVNode)
        } else {
          // 新旧的索引关系
          newIndexToOldIndexMap[newIndex - s2] = i + 1
          patch(oldVNode, c2[newIndex], el) // 更新属性, 不会复用元素
        }
      }
      // 最长递增子序列
      let increasingNewIndexSequence = getSequence(newIndexToOldIndexMap)
      let j = increasingNewIndexSequence.length - 1 // 2
      // 找出没有被patch过的新节点
      for (let i = toBePatched - 1; i >= 0; i--) {
        // 倒叙插入
        let currentIndex = i + s2 // 找到对应节点索引
        let child = c2[currentIndex] // 找到对应的节点
        let anchor = currentIndex < c2.length ? c2[currentIndex + 1] : null // 找到参照物
        if (newIndexToOldIndexMap[i] === 0) {
          // 没有被patch过的新节点
          patch(null, child, el, anchor)
        } else {
          // 最长递增子序列 减少移动操作
          // toBePatched [4, 2, 3, 0]
          //  [5, 3, 4, 0]   1 2345 不用移动 , 6移动调整位置
          if (i !== increasingNewIndexSequence[j]) {
            hostInsert(child.el, el, anchor)
          } else {
            j-- // 跳过不需要移动的元素
          }
        }
      }
    }
  }
  // 比较属性
  const patchProps = (oldProps, newProps, el) => {
    if (oldProps !== newProps) {
      for (let key in newProps) {
        let prev = oldProps[key] // 看旧对象中是否存在属性值
        let next = newProps[key] // 获取到新对象中的属性值
        if (prev !== next) {
          hostPatchProp(el, key, prev, next)
        }
      }
      for (let key in oldProps) {
        if ((!key as any) in newProps) {
          hostPatchProp(el, key, oldProps[key], null)
        }
      }
    }
  }
  // 比较孩子
  const patchChildren = (n1, n2, el) => {
    const c1 = n1.children
    const c2 = n2.children
    let prevShapeFlags = n1.shapeFlag
    let shapeFlags = n2.shapeFlag
    // 有四种情况
    // 1.旧有孩子 新没孩子
    // 2.旧没孩子 新有孩子
    // 3.新旧都有孩子

    // 新节点是文本
    if (shapeFlags & ShapeFlags.TEXT_CHILDREN) {
      // 1.旧节点是多个孩子(数组)
      if (prevShapeFlags & ShapeFlags.ARRAY_CHILDREN) {
        // 移除所有孩子
        unmountChildren(c1)
      }
      // 2.俩个都是文本节点, 直接替换掉
      if (c2 !== c1) {
        hostSetElementText(el, c2)
      }
    } else {
      // 现在是元素(数组), 上一次可能是文本 或者 数组
      if (prevShapeFlags & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlags & ShapeFlags.ARRAY_CHILDREN) {
          // 当前是元素(数组) 之前是数组 -> 俩个数组的对比 -> 核心diff算法
          patchKeyedChildren(c1, c2, el)
        } else {
          // 不是数组, 没有孩子(特殊情况, 当前是null)
          unmountChildren(c1) // 删除老的
        }
      } else {
        // 上一次是文本
        if (prevShapeFlags & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el, '')
        }
        //当前是数组
        if (shapeFlags & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el)
        }
      }
    }
  }
  // 更新元素
  const patchElement = (n1, n2, container, anchor) => {
    // 元素是相同节点
    let el = (n2.el = n1.el)

    // 更新属性, 更新孩子
    let oldProps = n1.props || {}
    let newProps = n2.props || {}

    // 比较属性
    patchProps(oldProps, newProps, el)

    // 比较孩子
    patchChildren(n1, n2, el)
  }
  // 处理组件
  const processComponent = (n1, n2, container) => {
    if (n1 == null) {
      // 组件没有上一次虚拟节点(挂载)
      mountComponent(n2, container)
    } else {
      // 更新
    }
  }
  // 处理文本ProcessText
  const ProcessText = (n1, n2, container, anchor ) => {
    if (n1 == null) {
      hostInsert((n2.el = hostCreateText(n2.children)), container, anchor)
    } else {
      // 更新文本
      const el = (n2.el = n1.el!)
      if (n2.children !== n1.children) {
        hostSetText(el, n2.children as string)
      }
    }
  }
  // 处理元素
  const processElement = (n1, n2, container, anchor) => {
    if (n1 == null) {
      mountElement(n2, container, anchor)
    } else {
      // 更新
      patchElement(n1, n2, container, anchor)
    }
  }
  /**
   * patch俩个作用(一个是挂载新节点, 一个是是更新节点)
   * @param n1  旧节点
   * @param n2  新节点
   * @param container  容易
   * @param anchor  参照物
   */
  const patch = (n1, n2, container, anchor = null) => {
    // 针对不同类型, 做初始化操作
    const { shapeFlag, type } = n2
    // 判断n1,n2 节点的type和key
    if (n1 && !isSameVNodeType(n1, n2)) {
      // 节点类型不一样, 删除旧的 添加新的
      anchor = hostNextSibling(n1.el) // 参照物(n1的下一个兄弟元素)
      unmount(n1) // 删除n1元素
    }
    // 处理不同类型
    switch (type) {
      case TEXT:
        // 处理文本
        ProcessText(n1, n2, container, anchor)
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 处理元素
          processElement(n1, n2, container, anchor)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // 处理组件
          processComponent(n1, n2, container)
        }
    }
  }
  // 渲染核心
  const render = (vnode, container) => {
    // core的核心, 根据不同的虚拟节点,创建对应的真实元素
    patch(null, vnode, container)
  }
  return {
    createApp: createAppAPI(render)
  }
}

// 最长递增子序列
// https://en.wikipedia.org/wiki/Longest_increasing_subsequence
function getSequence(arr) {
  const p = arr.slice()
  const result = [0] // 默认第0个
  let i, j, u, v, c
  const len = arr.length
  for (i = 0; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      j = result[result.length - 1]
      if (arr[j] < arrI) {
        p[i] = j
        result.push(i)
        continue
      }
      u = 0
      v = result.length - 1
      while (u < v) {
        c = (u + v) >> 1
        if (arr[result[c]] < arrI) {
          u = c + 1
        } else {
          v = c
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1]
        }
        result[u] = i
      }
    }
  }
  u = result.length
  v = result[u - 1]
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  return result
}

getSequence([5, 3, 4, 0])

import { PatchFlags } from '@vue/shared';
import { NodeTypes } from './NodeTypes'
import { CREATE_TEXT, CREATE_VNODE, TO_DISPLAY_STRING, OPEN_BLOCK, CREATE_BLOCK, FRAGMENT } from './runtimeHelpers';

function createVnodeCall(context, tag, props, children,  patchFlag) {
  context.helper(CREATE_VNODE)
  return {
    type: NodeTypes.VNODE_CALL,
    tag,
    props,
    children,
    patchFlag
  }
}

function transformElement(node, context) {
  // 希望在整个树处理后, 在处理元素
  if(node.type != NodeTypes.ELEMENT) {
    return
  }
  // 退出函数
  return () => {
    // createVnode('h1', {}, 'hello')
    const { tag, children } = node
    let vnodeTag = `'${tag}'`
    let vnodeProps // 处理属性
    let vnodeChildren // 处理儿子
    let vnodePatchFlag
    let patchFlag // 用于标识这个标签是不是动态的
    if(children.length > 0) {
      if(children.length === 1) {
        const child = children[0]
        const type = child.type // 看一下是不是动态
        const hasDynamicTextChild = type === NodeTypes.INTERPOLATION || type === NodeTypes.COMPOUND_EXPRESSION
        if(hasDynamicTextChild) {
          patchFlag += PatchFlags.TEXT
        }
        vnodeChildren = child
      }else {
        vnodeChildren = children
      }
    }
    if(patchFlag !== 0) {
      vnodePatchFlag = patchFlag + ''
    }
    node.codegenNode = createVnodeCall(context, vnodeTag, vnodeProps, vnodeChildren, vnodePatchFlag)
  }
}

function isText(node) {
  return node.type === NodeTypes.INTERPOLATION || node.type === NodeTypes.TEXT
}
function createCallExpression(callee, args) {
  return {
    type: NodeTypes.JS_CALL_EXPRESSION,
    callee,
    arguments: args
  }
}
function transformText(node, context) {
  // {{ name }} hello => [children, children] => createTextVNode(name + 'hello')
  
  if(node.type === NodeTypes.ROOT ||node.type === NodeTypes.ELEMENT) {
    // ...
    // 退出函数
    return () => {
      // 对元素中文本进行合并操作
      let hasText = false
      let children = node.children
      let container = null
      for(let i = 0; i < children.length; i++) {
        const child = children[i]
        if(isText(child)) {
          hasText = true // 进行合并
          for(let j = i + 1; j < children.length; j++) {
            const next = children[j]
            if(isText(next)) {
              if(!container) {
                container = children[i] = {
                  type: NodeTypes.COMPOUND_EXPRESSION,
                  loc: child.loc,
                  children: [child]
                }
                container.children.push('+', next)
                children.splice(j, 1)
                j--
              }
            }else {
              container = null
              break // 跳过
            }
          }
        }
      }

      if(!hasText || children.length === 1) return
      // 文本需要添加createText方法, helper添加
      for(let i = 0; i < children.length; i++) {
        const child = children[i]
        if(isText(child) || child.type === NodeTypes.COMPOUND_EXPRESSION) {
          const callArgs = [] // 用于存放参数的
          callArgs.push(child) // 文本内容
          if(child.type !== NodeTypes.TEXT) {
            callArgs.push(PatchFlags.TEXT + '')
          }
          children[i] = {
            type: NodeTypes.TEXT_CALL,
            content: child,
            loc: child.loc,
            codegenNode: createCallExpression(
              context.helper(CREATE_TEXT),
              callArgs
            )
          }
        }
      }
    }
  }  
}

// 转化的方法
export function getBaseTransformPreset() {
  return [
    // 方法1, 2...
    transformElement,
    transformText
  ]
}
// 创建上下文(参数过多)
function createTransformContext(root, nodeTransForms) {
  const context = {
    root,
    currentNode: root, // 当前节点, 会随着树的遍历而更新
    nodeTransForms,
    helpers: new Set(), // 代码中用到的具体方法
    helper(name) { 
      context.helpers.add(name)
      return name
    }
  }
  return context
}
function traverseChildren(node, context) {
  for(let i = 0; i < node.children.length; i++) {
    const child = node.children[i]
    traverseNode(child, context)
  }
}
// 遍历节点
function traverseNode(node, context) {
  const { nodeTransForms } = context
  context.currentNode = node
  const exits = []
  for(let i = 0; i < nodeTransForms.length; i++) {
    const onExit = nodeTransForms[i](node, context)
    onExit && exits.push(onExit)
  }
  switch(node.type) {
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traverseChildren(node, context)
      case NodeTypes.INTERPOLATION: // name => {obj.name}.toString
      context.helper(TO_DISPLAY_STRING)
  }
  let i = exits.length

  // 为了保证退出方法对应的context.currentNode是正确的
  context.currentNode = node
  while(i--) {
    exits[i]()
  }
}
// 多个根节点, 用fragment
function createRootCodegen(root, context) {
  const { helper } = context
  const children = root.children
  helper(OPEN_BLOCK)
  helper(CREATE_BLOCK)
  if(children.length === 1) {
    const child = children[0]
    const codegen = child.codegenNode // 获取刚才转化后的codegen

    codegen.isBlock = true // 只有一个儿子, 那么它就是blocktree的根节点
    root.codegenNode = codegen
  }else if(children.length >  1){
    // 多个儿子, 生成fragment
    root.codegenNode = createVnodeCall(
      context, 
      helper(FRAGMENT), 
      undefined, 
      children, 
      PatchFlags.STABLE_FRAGMENT)
      root.codegenNode.isBlock = true
  }
}
export function transform(root, nodeTransForms) {
  // 创建转换时的上下文
  const context = createTransformContext(root, nodeTransForms)
  // 遍历节点
  traverseNode(root, context)
  createRootCodegen(root, context)

  root.helpers = [...context.helpers] // context的属性放到root

}


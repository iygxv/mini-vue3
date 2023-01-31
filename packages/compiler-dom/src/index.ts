import { PatchFlags } from '@vue/shared';
import { NodeTypes } from './NodeTypes';
import { baseParse } from './parse'
import { CREATE_TEXT } from './runtimeHelpers';

function transformElement(node, context) {
  // 希望在整个树处理后, 在处理元素
  if(node.type != NodeTypes.ELEMENT) {
    return
  }
  // 退出函数
  return () => {
    console.log('处理元素回调');
    
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
function getBaseTransformPreset() {
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
  }
  let i = exits.length

  // 为了保证退出方法对应的context.currentNode是正确的
  context.currentNode = node
  while(i--) {
    exits[i]()
  }
}
function transform(root, nodeTransForms) {
  // 创建转换时的上下文
  const context = createTransformContext(root, nodeTransForms)
  // 遍历节点
  traverseNode(root, context)
}


export function baseCompiler(template) {
  // 1.将模版转化ast
  const ast = baseParse(template)
  // 2.将ast语法进行转化 (优化 静态提升 方法缓存 生成代码为了最终生成代码时使用)
  const nodeTransForms = getBaseTransformPreset() // 每遍历一个节点 都要调用里面的方法

  transform(ast, nodeTransForms)
  return ast
}
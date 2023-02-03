import { helperNameMap, OPEN_BLOCK } from './runtimeHelpers';
import { NodeTypes } from './NodeTypes';

function createCodegenContext(ast) {
  const newLine = (n) => {
    context.push('\n' + '  '.repeat(n))
  }
  const context = {
    code: ``, // 拼的结果
    indentLevel: 0, // 缩进等级
    push(c) {
      context.code += c
    },
    helper(key) {
      return `${helperNameMap[key]}`
    },
    newLine() {
      newLine(context.indentLevel) // 换行
    },
    indent() {
      newLine(++context.indentLevel) // 缩进
    },
    deindent() {
      newLine(--context.indentLevel) // 减少缩进
    }
  }
  return context
}
function genVnodeCall(node, context) {
  const { push } = context
  const { tag, children, props, PatchFlags, isBlock} = node
  if(isBlock) {
    push(`${helperNameMap[OPEN_BLOCK]}()`)
  }
}
function genNode(node, context) {
  switch (node.type) {
    case NodeTypes.VNODE_CALL:
      genVnodeCall(node, context)
      break
    case NodeTypes.ELEMENT:
      break
    case NodeTypes.TEXT:
      break
    case NodeTypes.INTERPOLATION:
      break
    case NodeTypes.SIMPLE_EXPRESSION:
      break
    case NodeTypes.COMPOUND_EXPRESSION:
      break
    case NodeTypes.TEXT_CALL:
      break
    case NodeTypes.JS_CALL_EXPRESSION:
      break
  }

}
export function generate(ast) {
  const context = createCodegenContext(ast)
  const { push, newLine, indent, deindent } = context
  push(`const _Vue = Vue`)
  newLine()
  push(`return function render(_ctx) {`)
  indent()
  push(`with (_ctx) {`)
  indent()
  push(`const {${ast.helpers.map(s => helperNameMap[s]).join(',')}} = _Vue`)
  newLine()
  push(`return (`)
  genNode(ast.codegenNode, context)
  push(`)`)
  deindent()
  push(`}`)
  deindent()
  push(`}`)
  return context.code
}

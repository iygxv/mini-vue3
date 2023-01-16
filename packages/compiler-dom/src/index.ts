import { NodeTypes } from './NodeTypes'

// 是不是解析完成了
function isParseEnd(context) {
  return !context.source
}


function parseElement(context) {

}
function parseInterpolation(context) {

}
function getCursor(context) {
  let {line, column, offset} = context
  return {
    line,
    column,
    offset
  }
}
// 根据内容和结束索引来修改上下文信息
function adVancePositionWithMutation(context, s, endIndex) {
  // 如何更新行信息 (遇到换行 +1 行)
  let linesCount = 0
  let linePos = -1
  
  for(let i = 0; i < endIndex; i++) {
    if(s.charCodeAt(i) === 10) {
      linesCount ++ 
      linePos = i // 换行后第一个人的位置
    }
  }
  debugger
  context.line += linesCount
  // 如何更新列数
  context.column = linePos === -1 ? context.column + endIndex: endIndex - linePos
  // 更新偏移量
  context.offset += endIndex
}
// 前进
function advanceBy(context, endIndex) {
  let s = context.source // 原内容
  // 计算出一个新的结束位置
  adVancePositionWithMutation(context, s, endIndex)
  context.source = s.slice(endIndex)
}

function parseTextData(context, endIndex) {
  const rawText = context.source.slice(0, endIndex)
  // 前进
  advanceBy(context, endIndex)
  return rawText
} 
function getSelection(context, start) {
  let end = getCursor(context)
  return {
    start,
    end,
    source: context.originalSource.slice(start.offset, end.offset)
  } 
}
function parseText(context) {
  // 文本结束
  const endTokens = ['<', '{{']
  let endIndex = context.source.length // 文本的整个长度
  // 看先遇到 < 还是 {{
  for(let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i], 1)
    if(index !== -1 && endIndex > index) {
      endIndex = index
    }
  }
  // 有了文本的结束位置, 就算行列信息
  let start = getCursor(context)
  // 截取
  const content = parseTextData(context, endIndex)
  return {
    type: NodeTypes.TEXT,
    content,
    loc: getSelection(context, start),
  }
}

function parseChildren(context) {
  const nodes = []
  // 不同的内容做不同的处理
  while(!isParseEnd(context)) {
    const s = context.source // 上下文内容
    let node
    if(s[0] === '<') { // 标签
      node = parseElement(context)
    }else if(s.startsWith('{{')) { // 表达式
      node = parseInterpolation(context)
    }else {
      node = parseText(context)
    }
    nodes.push(node)
  }
  console.log(nodes);
  
  return nodes
}

function createParseContext(context) {
  return {
    line: 1,
    column: 1,
    offset: 0,
    source: context, // 这个source会不断被截取
    originalSource: context // 不会变的, 记录传入的内容
  }

}

function baseParse(content) {
  // 标识节点的信息 (行 列 偏移量), 每解析一段,删除这一段
  const context = createParseContext(content)
  return parseChildren(context)
}


export function baseCompiler(template) {
  // 1.将模版转化ast
  const ast = baseParse(template)
  return ast
}
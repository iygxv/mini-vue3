import { NodeTypes } from './NodeTypes'

// 是不是解析完成了
function isParseEnd(context) {
  if (context.source.startsWith('</')) {
    // 遇到结束标签, 直接结束
    return true
  }
  return !context.source
}

// 删除空格
function advanceSpaces(context) {
  const match = /^[ \t\r\n]+/.exec(context.source)
  if (match) {
    advanceBy(context, match[0].length)
  }
}

// 解析标签
function parseTag(context) {
  const start = getCursor(context)
  // 匹配标签名
  const match = /^<\/?([a-z][^ \t\r\n/>]*)/.exec(context.source)
  const tag = match[1]
  advanceBy(context, match[0].length)
  advanceSpaces(context)
  const isSelfClosing = context.source.startsWith('/>')
  advanceBy(context, isSelfClosing ? 2 : 1)
  return {
    type: NodeTypes.ELEMENT,
    tag,
    isSelfClosing,
    loc: getSelection(context, start)
  }
}
function parseElement(context) {
  let ele: any = parseTag(context)

  // 如果有children ,递归解析
  const children = parseChildren(context)

  // 遇到结束标签
  if (context.source.startsWith('</')) {
    parseTag(context)
  }
  if (children) {
    ele.children = children
  }
  ele.loc = getSelection(context, ele.loc.start)
  return ele
}
function parseInterpolation(context) {
  // 获取表达式start位置
  const start = getCursor(context)
  //  获取表达式end位置
  const closeIndex = context.source.indexOf('}}', '{{')
  // 前进2 , 也就是删除{{
  advanceBy(context, 2)
  // 下面开始获取表达式里面的内容信息
  const innerStart = getCursor(context)
  const innerEnd = getCursor(context) // 后续会改
  const rawContentLength = closeIndex - 2 // 去除{{ 后的长度, 包含空格
  // 去除空格前的内容 =>  name
  const preTrimContent = parseTextData(context, rawContentLength)
  const content = preTrimContent.trim() // 去除前后空格

  const startOffset = preTrimContent.indexOf(content) // name }}
  if (startOffset > 0) { // 前面有空格
    advancePositionWithMutation(innerStart, preTrimContent, startOffset)
  }
  // 更新innerEnd
  const endOffset = content.length + startOffset
  advancePositionWithMutation(innerEnd, preTrimContent, endOffset)
  advanceBy(context, 2)

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      isStatic: false,
      loc: getSelection(context, innerStart, innerEnd),
      content
    },
    loc: getSelection(context, start)
  }
}
// 获取line column offset
function getCursor(context) {
  let { line, column, offset } = context
  return {
    line,
    column,
    offset
  }
}
// 根据内容和结束索引来修改上下文信息
function advancePositionWithMutation(context, s, endIndex) {
  // 如何更新行信息 (遇到换行 +1 行)
  let linesCount = 0
  let linePos = -1

  for (let i = 0; i < endIndex; i++) {
    if (s.charCodeAt(i) === 10) {
      linesCount++
      linePos = i // 换行后第一个人的位置
    }
  }
  context.line += linesCount
  // 如何更新列数
  context.column = linePos === -1 ? context.column + endIndex : endIndex - linePos
  // 更新偏移量
  context.offset += endIndex
}
// 前进
function advanceBy(context, endIndex) {
  let s = context.source // 原内容
  // 计算出一个新的结束位置
  advancePositionWithMutation(context, s, endIndex)
  context.source = s.slice(endIndex)
}

function parseTextData(context, endIndex) {
  const rawText = context.source.slice(0, endIndex)
  // 前进
  advanceBy(context, endIndex)
  return rawText
}
function getSelection(context, start, end?) {
  end = end || getCursor(context)
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
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i], 1)
    if (index !== -1 && endIndex > index) {
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
  while (!isParseEnd(context)) {
    const s = context.source // 上下文内容
    let node
    if (s[0] === '<') { // 标签
      node = parseElement(context)
    } else if (s.startsWith('{{')) { // 表达式
      node = parseInterpolation(context)
    } else {
      node = parseText(context)
    }
    nodes.push(node)
  }
  nodes.forEach((node, index) => {
    if (node.type === NodeTypes.TEXT) {
      if (!/[^ \t\r\n]/.test(node.content)) {
        nodes[index] = null
      } else {
        node.content = node.content.replace(/[ \t\r\n]+/g, '')
      }
    }
  })
  return nodes.filter(Boolean)
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

// 创建根节点
function createRoot(children, loc) {
  return {
    type: NodeTypes.ROOT,
    children,
    loc
  }
}
export function baseParse(content) {
  // 标识节点的信息 (行 列 偏移量), 每解析一段,删除这一段
  const context = createParseContext(content)
  // 创建根节点
  const children = parseChildren(context)
  const start = getCursor(context) // 记录开始位置
  return createRoot(children, getSelection(context, start))
}

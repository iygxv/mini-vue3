
import { baseParse } from './parse'
import { getBaseTransformPreset, transform } from './transform'
import { generate } from './generate'
export function baseCompiler(template) {
  // 1.将模版转化ast
  const ast = baseParse(template)
  // 2.将ast语法进行转化 (优化 静态提升 方法缓存 生成代码为了最终生成代码时使用)
  const nodeTransForms = getBaseTransformPreset() // 每遍历一个节点 都要调用里面的方法
  transform(ast, nodeTransForms)
  // 生成代码, 字符串拼接  => new Function生成实现
  const code = generate(ast)

  return code 
}
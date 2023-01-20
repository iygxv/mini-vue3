import { baseParse } from './parse'



export function baseCompiler(template) {
  // 1.将模版转化ast
  const ast = baseParse(template)
  return ast
}
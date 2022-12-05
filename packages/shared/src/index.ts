// 在 TypeScript 中，is是一个 类型谓词，用来帮助 ts 编译器 收窄 变量的类型。
// 这里是说 返回true 就说明 val 是对象类型
export const isObject = (val: unknown): val is Record<any, any> => val !== null && typeof val === 'object'
export const extend = Object.assign
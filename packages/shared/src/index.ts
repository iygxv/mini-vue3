// 在 TypeScript 中，is是一个 类型谓词，用来帮助 ts 编译器 收窄 变量的类型。
// 这里是说 返回true 就说明 val 是对象类型
export const isObject = (val: unknown): val is Record<any, any> => val !== null && typeof val === 'object'
export const extend = Object.assign


// 比较值是否改变
export const hasChanged = (value: any, oldValue: any): boolean => !Object.is(value, oldValue)

export const isFunction = (val): val is Function => typeof val === 'function'
export const isString = (val: unknown): val is string => typeof val === 'string'
// 是否数组
export const isArray = Array.isArray
// 是否为整数key
export const isIntegerKey = (key) => parseInt(key) + '' === key

// 是否有这个属性
const hasOwnProperty = Object.prototype.hasOwnProperty
export const hasOwn = (target, key) => hasOwnProperty.call(target, key)


// 判断是否是事件
const onRE = /^on[^a-z]/
export const isOn = (key: string) => onRE.test(key)



export * from './shapeFlags'
export * from './patchFlags'
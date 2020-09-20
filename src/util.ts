export function isFunction<F>(functionToCheck: any): functionToCheck is Function {
  return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]'
}

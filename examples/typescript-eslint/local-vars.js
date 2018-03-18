const {
  config,
  parse
} = require('./config')

const {
  getLocalVariableNames,
  code
} = require('../examples/local-vars')

const result = parse(code, config)
const {
  ast
} = result

console.log('Local variables:', getLocalVariableNames(ast).join(', '))

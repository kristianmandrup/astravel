const {
  config,
  parse,
  code
} = require('./config')

const result = parse(code.tsx, config)
console.log({
  AST: result.ast
})

console.log(result.json)

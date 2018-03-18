/*
This example shows how to retrieve a list of local variable names.
*/

const acorn = require('acorn')
const {
  getLocalVariableNames,
  code
} = require('../examples/local-vars')

const ast = acorn.parse(code, {
  ecmaVersion: 6
})

console.log(code)
console.log('Local variables:', getLocalVariableNames(ast).join(', '))

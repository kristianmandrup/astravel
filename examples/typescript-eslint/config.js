const config = {
  loc: true,
  range: true,
  // tokens: true,
  errorOnUnknownASTType: true,
  useJSXTextNode: true,
  ecmaFeatures: {
    jsx: true
  }
}

const code = require('./code')

const parser = require('typescript-eslint-parser')

function parse(code, config) {
  const ast = parser.parseForESLint(code, config).ast;
  return {
    json: JSON.stringify(ast, null, 2),
    ast
  }
}

module.exports = {
  config,
  parse,
  code
}

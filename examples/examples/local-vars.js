const astravel = require('../../dist/astravel.min')

const ignore = Function.prototype

const traveler = astravel.makeTraveler({
  FunctionDeclaration: function (node, state) {
    state.names.push(node.id.name)
  },
  BlockStatement: function (node, state) {
    if (!state.inBlock) {
      state.inBlock = true
      this.super.BlockStatement.call(this, node, state)
      state.inBlock = false
    } else {
      this.super.BlockStatement.call(this, node, state)
    }
  },
  VariableDeclaration: function (node, state) {
    if ((state.inBlock && node.kind === 'var') || !state.inBlock) {
      state.inDeclaration = true
      this.super.VariableDeclaration.call(this, node, state)
      state.inDeclaration = false
    }
  },
  VariableDeclarator: function (node, state) {
    this.go(node.id, state)
  },
  ObjectPattern: function (node, state) {
    if (state.inDeclaration) this.super.ObjectPattern.call(this, node, state)
  },
  ArrayPattern: function (node, state) {
    if (state.inDeclaration) this.super.ArrayPattern.call(this, node, state)
  },
  Property: function (node, state) {
    if (state.inDeclaration) this.go(node.value, state)
  },
  Identifier: function (node, state) {
    if (state.inDeclaration) state.names.push(node.name)
  },
  FunctionExpression: ignore,
  ArrowFunctionExpression: ignore
})

function getLocalVariableNames(ast) {
  const state = {
    inBlock: false,
    inDeclaration: false,
    names: []
  }
  traveler.go(ast, state)
  // Filter duplicate names
  return state.names.filter(function (value, index, list) {
    return list.indexOf(value) === index
  })
}

const code = [
  "var a = 1, b = 2;",
  "var a = 1;",
  "let {x, y} = {x: 0, y: 0};",
  "const Y = 4",
  "function add(a, b) {return a + b;}",
  "if (a > b) {",
  "   let c = 5;",
  "   var [d] = someArray, {e: f} = someObject;",
  "}",
  "g = a + b;"
].join("\n") + "\n"

module.exports = {
  code,
  traveler,
  getLocalVariableNames
}

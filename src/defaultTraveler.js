let ForInStatement,
  FunctionDeclaration,
  RestElement,
  BinaryExpression,
  ArrayExpression

const ignore = Function.prototype

class Found {
  constructor(node, state, opts = {}) {
    this.node = node
    this.state = state
    this.opts = opts
  }
}

function isFunction(fun) {
  return typeof fun === 'function'
}

const defaults = {
  log() {}
}

function populateOpts(opts) {
  opts.log = opts.log || defaults.log
  return opts
}

export default {
  // Basic methods
  go(node, state, opts = {}) {
    populateOpts(opts)
    /*
    Starts travelling through the specified AST `node` with the provided `state`.
    This method is recursively called by each node handler.
    */
    const fun = this[node.type]

    if (!isFunction(fun)) {
      throw new Error(`AST traveller is missing a visitor function for ${node.type}`)
    }

    opts.log({
      type: node.type,
      node,
      state
    })

    fun(node, state, opts)
  },
  find(predicate, node, state, opts = {}) {
    populateOpts(opts)
    /*
    Returns { node, state } for which `predicate(node, state, opts)` returns truthy,
    starting at the specified AST `node` and with the provided `state`.
    Otherwise, returns `undefined`.
    */
    const finder = Object.create(this)
    finder.go = function (node, state, opts) {
      if (predicate(node, state, opts)) {
        throw new Found(node, state, opts)
      }
      this[node.type](node, state, opts)
    }
    try {
      finder.go(node, state, opts)
    } catch (error) {
      if (error instanceof Found) {
        return error
      } else {
        throw error
      }
    }
  },
  // take the default function as optional second argument
  // otherwise fallback to use method from defaultTraveller
  makeChild(properties = {}, {
    defaultHandler,
    allKeys
  }) {
    /*
    Returns a custom AST traveler that inherits from `this` traveler with its own provided `properties` and the property `super` that points to the parent traveler object.
    */
    const traveler = Object.create(this)

    // is allKeys option is set, iterate all traveler keys, not just those supplied
    const propsObj = allKeys ? traveler.super : properties

    for (let key in propsObj) {
      const fun = properties[key]
      const defHandler = defaultHandler || traveler.super[key]
      // keep the default traveler function if
      traveler[key] = isFunction(fun) ? fun : defHandler
    }
    return traveler
  },

  // JavaScript 5
  Program(node, state, opts = {}) {
    const statements = node.body,
      {
        length
      } = statements
    for (let i = 0; i < length; i++) {
      this.go(statements[i], state, opts)
    }
  },
  BlockStatement(node, state, opts = {}) {
    const statements = node.body
    if (statements != null) {
      for (let i = 0, {
          length
        } = statements; i < length; i++) {
        this.go(statements[i], state, opts)
      }
    }
  },
  EmptyStatement: ignore,
  ExpressionStatement(node, state, opts = {}) {
    this.go(node.expression, state, opts)
  },
  IfStatement(node, state, opts = {}) {
    this.go(node.test, state, opts)
    this.go(node.consequent, state, opts)
    if (node.alternate != null) {
      this.go(node.alternate, state, opts)
    }
  },
  LabeledStatement(node, state, opts = {}) {
    opts.log('LabeledStatement', {
      node,
      state
    })

    this.go(node.label, state, opts)
    this.go(node.body, state, opts)
  },
  BreakStatement(node, state, opts = {}) {
    if (node.label) {
      this.go(node.label, state, opts)
    }
  },
  ContinueStatement(node, state, opts = {}) {
    if (node.label) {
      this.go(node.label, state, opts)
    }
  },
  WithStatement(node, state, opts = {}) {
    this.go(node.object, state, opts)
    this.go(node.body, state, opts)
  },
  SwitchStatement(node, state, opts = {}) {
    this.go(node.discriminant, state, opts)
    const {
      cases
    } = node, {
      length
    } = cases
    for (let i = 0; i < length; i++) {
      this.go(cases[i], state, opts)
    }
  },
  SwitchCase(node, state, opts = {}) {
    if (node.test != null) {
      this.go(node.test, state, opts)
    }
    const statements = node.consequent,
      {
        length
      } = statements
    for (let i = 0; i < length; i++) {
      this.go(statements[i], state, opts)
    }
  },
  ReturnStatement(node, state, opts = {}) {
    if (node.argument) {
      this.go(node.argument, state, opts)
    }
  },
  ThrowStatement(node, state, opts = {}) {
    this.go(node.argument, state, opts)
  },
  TryStatement(node, state, opts = {}) {
    this.go(node.block, state, opts)
    if (node.handler != null) {
      this.go(node.handler, state, opts)
    }
    if (node.finalizer != null) {
      this.go(node.finalizer, state, opts)
    }
  },
  CatchClause(node, state, opts = {}) {
    this.go(node.param, state, opts)
    this.go(node.body, state, opts)
  },
  WhileStatement(node, state, opts = {}) {
    this.go(node.test, state, opts)
    this.go(node.body, state, opts)
  },
  DoWhileStatement(node, state, opts = {}) {
    this.go(node.body, state, opts)
    this.go(node.test, state, opts)
  },
  ForStatement(node, state, opts = {}) {
    if (node.init != null) {
      this.go(node.init, state, opts)
    }
    if (node.test != null) {
      this.go(node.test, state, opts)
    }
    if (node.update != null) {
      this.go(node.update, state, opts)
    }
    this.go(node.body, state, opts)
  },
  ForInStatement: (ForInStatement = function (node, state, opts = {}) {
    this.go(node.left, state, opts)
    this.go(node.right, state, opts)
    this.go(node.body, state, opts)
  }),
  DebuggerStatement: ignore,
  FunctionDeclaration: (FunctionDeclaration = function (node, state, opts) {
    if (node.id != null) {
      this.go(node.id, state, opts)
    }
    const {
      params
    } = node
    if (params != null) {
      for (let i = 0, {
          length
        } = params; i < length; i++) {
        this.go(params[i], state, opts)
      }
    }
    this.go(node.body, state, opts)
  }),
  VariableDeclaration(node, state, opts = {}) {
    const {
      declarations
    } = node, {
      length
    } = declarations
    for (let i = 0; i < length; i++) {
      this.go(declarations[i], state, opts)
    }
  },
  VariableDeclarator(node, state, opts = {}) {
    this.go(node.id, state, opts)
    if (node.init != null) {
      this.go(node.init, state, opts)
    }
  },
  ArrowFunctionExpression(node, state, opts = {}) {
    const {
      params
    } = node
    if (params != null) {
      for (let i = 0, {
          length
        } = params; i < length; i++) {
        this.go(params[i], state, opts)
      }
    }
    this.go(node.body, state, opts)
  },
  ThisExpression: ignore,
  ArrayExpression: (ArrayExpression = function (node, state, opts = {}) {
    const {
      elements
    } = node, {
      length
    } = elements
    for (let i = 0; i < length; i++) {
      let element = elements[i]
      if (element != null) {
        this.go(elements[i], state, opts)
      }
    }
  }),
  ObjectExpression(node, state, opts = {}) {
    const {
      properties
    } = node, {
      length
    } = properties
    for (let i = 0; i < length; i++) {
      this.go(properties[i], state, opts)
    }
  },
  Property(node, state, opts) {
    this.go(node.key, state, opts)
    if (!node.shorthand) {
      this.go(node.value, state, opts)
    }
  },
  FunctionExpression: FunctionDeclaration,
  SequenceExpression(node, state, opts = {}) {
    const {
      expressions
    } = node, {
      length
    } = expressions
    for (let i = 0; i < length; i++) {
      this.go(expressions[i], state, opts)
    }
  },
  UnaryExpression(node, state, opts = {}) {
    this.go(node.argument, state, opts)
  },
  UpdateExpression(node, state, opts = {}) {
    this.go(node.argument, state, opts)
  },
  AssignmentExpression(node, state, opts) {
    this.go(node.left, state, opts)
    this.go(node.right, state, opts)
  },
  BinaryExpression: (BinaryExpression = function (node, state, opts = {}) {
    this.go(node.left, state, opts)
    this.go(node.right, state, opts)
  }),
  LogicalExpression: BinaryExpression,
  ConditionalExpression(node, state, opts = {}) {
    this.go(node.test, state, opts)
    this.go(node.consequent, state, opts)
    this.go(node.alternate, state, opts)
  },
  NewExpression(node, state, opts = {}) {
    this.CallExpression(node, state, opts)
  },
  CallExpression(node, state, opts = {}) {
    this.go(node.callee, state, opts)
    const args = node['arguments'],
      {
        length
      } = args
    for (let i = 0; i < length; i++) {
      this.go(args[i], state, opts)
    }
  },
  MemberExpression(node, state, opts = {}) {
    this.go(node.object, state, opts)
    this.go(node.property, state, opts)
  },
  Identifier: ignore,
  Literal: ignore,

  // JavaScript 6
  ForOfStatement: ForInStatement,
  ClassDeclaration(node, state, opts = {}) {
    if (node.id) {
      this.go(node.id, state, opts)
    }
    if (node.superClass) {
      this.go(node.superClass, state, opts)
    }
    this.go(node.body, state, opts)
  },
  ClassBody(node, state, opts = {}) {
    const {
      body
    } = node, {
      length
    } = body
    for (let i = 0; i < length; i++) {
      this.go(body[i], state, opts)
    }
  },
  ImportDeclaration(node, state, opts = {}) {
    const {
      specifiers
    } = node, {
      length
    } = specifiers
    for (let i = 0; i < length; i++) {
      this.go(specifiers[i], state, opts)
    }
    this.go(node.source, state, opts)
  },
  ImportNamespaceSpecifier(node, state, opts = {}) {
    this.go(node.local, state, opts)
  },
  ImportDefaultSpecifier(node, state, opts = {}) {
    this.go(node.local, state, opts)
  },
  ImportSpecifier(node, state, opts) {
    this.go(node.imported, state, opts)
    this.go(node.local, state, opts)
  },
  ExportDefaultDeclaration(node, state, opts = {}) {
    this.go(node.declaration, state, opts)
  },
  ExportNamedDeclaration(node, state, opts = {}) {
    if (node.declaration) {
      this.go(node.declaration, state, opts)
    }
    const {
      specifiers
    } = node, {
      length
    } = specifiers
    for (let i = 0; i < length; i++) {
      this.go(specifiers[i], state, opts)
    }
    if (node.source) {
      this.go(node.source, state, opts)
    }
  },
  ExportSpecifier(node, state, opts = {}) {
    this.go(node.local, state, opts)
    this.go(node.exported, state, opts)
  },
  ExportAllDeclaration(node, state, opts = {}) {
    this.go(node.source, state, opts)
  },
  MethodDefinition(node, state, opts) {
    this.go(node.key, state, opts)
    this.go(node.value, state, opts)
  },
  ClassExpression(node, state, opts = {}) {
    this.ClassDeclaration(node, state, opts)
  },
  Super: ignore,
  RestElement: (RestElement = function (node, state, opts = {}) {
    this.go(node.argument, state, opts)
  }),
  SpreadElement: RestElement,
  YieldExpression(node, state, opts = {}) {
    if (node.argument) {
      this.go(node.argument, state, opts)
    }
  },
  TaggedTemplateExpression(node, state, opts = {}) {
    this.go(node.tag, state, opts)
    this.go(node.quasi, state, opts)
  },
  TemplateLiteral(node, state, opts = {}) {
    const {
      quasis,
      expressions
    } = node
    for (let i = 0, {
        length
      } = expressions; i < length; i++) {
      this.go(expressions[i], state, opts)
    }
    for (let i = 0, {
        length
      } = quasis; i < length; i++) {
      this.go(quasis[i], state, opts)
    }
  },
  TemplateElement: ignore,
  ObjectPattern(node, state, opts = {}) {
    const {
      properties
    } = node, {
      length
    } = properties
    for (let i = 0; i < length; i++) {
      this.go(properties[i], state, opts)
    }
  },
  ArrayPattern: ArrayExpression,
  AssignmentPattern(node, state, opts = {}) {
    this.go(node.left, state, opts)
    this.go(node.right, state, opts)
  },
  MetaProperty(node, state, opts = {}) {
    this.go(node.meta, state, opts)
    this.go(node.property, state, opts)
  },

  // JavaScript 7
  AwaitExpression(node, state, opts = {}) {
    this.go(node.argument, state, opts)
  },

  // TypeScript
  Decorator(node, state, opts = {}) {
    this.go(node.argument, state, opts)
  },

  ClassImplements(node, state, opts = {}) {
    this.go(node.argument, state, opts)
  },

  TSTypeAnnotation(node, state, opts = {}) {
    this.go(node.argument, state, opts)
  },

  TSStringKeyword(node, state, opts = {}) {
    this.go(node.argument, state, opts)
  },
}

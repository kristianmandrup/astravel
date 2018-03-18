module.exports = `
namespace Admin {
  export const $decorator = {
    hello: {
      examples: {
        valid: {
          args: ['kris']
        },
        invalid: {
          args: [''],
          result: '!throws'
        }
      }
    }
  }

  interface IComponent {
    setState(props: any, state: any): any
    render(): void
  }

  @examples({
    valid: {
      name: {
        args: ['kristian']
      }
    },
    invalid: {
      name: {
        args: [''],
        result: examples.THROWS
      }
    }
  })
  abstract class MyComponent extends Logger implements IComponent {
    name: string = 'MyComponent'

    constructor(opts: any) {
      super(opts)
    }

    public isCool() {
      return true
    }

    static public isCool() {
      return true
    }
  }

  export function hello(name: string): string {
    if (name === '') throw new Error('invalid name')
    return 'hi ' + name
  }
}`

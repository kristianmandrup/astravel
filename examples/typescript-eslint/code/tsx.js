module.exports = `@component({
  label: 'my component'
}) class MyComponent {
  render(): {
    return (
      <App props={this.props} />
    )
  }
}
`

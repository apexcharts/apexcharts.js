module.exports = {
  process(code) {
    return `module.exports = ${JSON.stringify(code)}`
  },
  getCacheKey() {
    return 'svg-transform'
  }
}

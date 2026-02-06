module.exports = {
  process(code) {
    return {
      code: `module.exports = ${JSON.stringify(code)}`
    }
  },
  getCacheKey() {
    return 'svg-transform'
  }
}

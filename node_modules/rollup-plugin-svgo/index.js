module.exports = function svg(options = {
  plugins: [
    'removeDimensions',
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false
        }
      }
    }
  ]
}) {
  const optimize = options.raw
    ? x => Promise.resolve({ data: x })
    : options.optimize || require('svgo').optimize

  return {
    name: 'svgo',
    transform: (code, id) => {
      if (id.endsWith('.svg')) {
        const result = options?.raw ? { data: code } : optimize(code, { path: id, ...options })
        return {
          map: { mappings: '' },
          code: 'export default ' + JSON.stringify(result.data)
        }
      }
    }
  }
}

const TEST_NONCE =
  '47ebaa88ef82ffb86e4ccb0eab1c5ec6bd76767642358e8cf99487673d5904b5'

const cspPolicies = [`style-src 'self' 'unsafe-inline' 'nonce-${TEST_NONCE}'`]

module.exports = {
  server: {
    baseDir: './samples',
    directory: true,
    routes: {
      '/dist': './dist',
      '/src/assets': './src/assets',
    },
  },
  files: [
    './samples/vanilla-js/csp',
    './samples/react/csp',
    './samples/vue/csp',
  ],
  startPath: '/',
  middleware: [
    function (req, res, next) {
      const url = req.url
      const allowedPrefixes = [
        '/vanilla-js/csp',
        '/react/csp',
        '/vue/csp',
        '/assets',
        '/src',
        '/dist',
      ]

      if (url === '/') {
        res.setHeader('Content-Type', 'text/html')
        res.end(`
          <h1>Content Security Policy Test Directories</h1>
          <ul>
            <li><a href="/vanilla-js/csp/">vanilla-js/csp/</a></li>
            <li><a href="/react/csp/">react/csp/</a></li>
            <li><a href="/vue/csp/">vue/csp/</a></li>
          </ul>
        `)
        return
      }

      const isAllowed = allowedPrefixes.some(
        (prefix) => url.startsWith(prefix + '/') || url === prefix
      )

      if (isAllowed) {
        return next()
      }

      res.statusCode = 403
      res.setHeader('Content-Type', 'text/plain')
      res.end('Forbidden')
    },
    function (req, res, next) {
      res.setHeader('Content-Security-Policy', cspPolicies.join('; '))
      next()
    },
  ],
}

// Load environment variables in the same order as Next.js
let dev = true;
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '.env' })
  require('dotenv').config({ path: '.env.development' })
} else {
  require('dotenv').config({ path: '.env.production' })
  dev = false;
}

const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const hostname = 'localhost'
const port = process.env.PORT || 3000

// Create Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
})
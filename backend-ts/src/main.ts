import Fastify from 'fastify'
import cors from '@fastify/cors'
import dotenv from 'dotenv'
import { registerRoutes } from './routes'

dotenv.config()

const app = Fastify({ logger: true })

// 启用 CORS
app.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
})

// 注册路由
registerRoutes(app)

// 启动服务器
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '8000')
    await app.listen({ port, host: '0.0.0.0' })
    console.log(`Server listening on http://localhost:${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
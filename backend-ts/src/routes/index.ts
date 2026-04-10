import { FastifyInstance } from 'fastify'
import { getCategoryTypes, search } from '../services/amap'
import { parseQuery } from '../services/llm'
import { SearchRequestSchema, NLQueryRequestSchema } from '../types'

export async function registerRoutes(app: FastifyInstance) {
  // 获取分类列表
  app.get('/api/categories', async (request, reply) => {
    return getCategoryTypes()
  })

  // 搜索店铺
  app.post('/api/search', async (request, reply) => {
    try {
      const body = SearchRequestSchema.parse(request.body)
      const result = await search(
        body.location,
        body.category,
        undefined,
        body.limit,
        body.sort_by ?? null,
        body.sort_order
      )
      return result
    } catch (error: any) {
      if (error.name === 'ZodError') {
        reply.code(400).send({ detail: error.errors })
      } else if (error.message.includes('不支持分类')) {
        reply.code(400).send({ detail: error.message })
      } else {
        reply.code(500).send({ detail: `查询失败: ${error.message}` })
      }
    }
  })

  // 自然语言查询理解
  app.post('/api/understand', async (request, reply) => {
    const startTime = Date.now()
    try {
      const body = NLQueryRequestSchema.parse(request.body)

      let parsedQuery
      try {
        parsedQuery = await parseQuery(body.query)
      } catch (llmError: any) {
        // LLM 失败时降级处理
        parsedQuery = {
          raw_query: body.query,
          extracted_params: {
            location: body.query,
            category: null,
            sort_by: null,
            sort_order: null,
            preferences: [],
          },
          confidence: 0,
          ambiguity_warning: `LLM unavailable: ${llmError.message}`,
        }
      }

      const location = parsedQuery.extracted_params.location ?? body.query
      const category = parsedQuery.extracted_params.category ?? '美食'
      const sortBy = parsedQuery.extracted_params.sort_by
      const sortOrder = parsedQuery.extracted_params.sort_order ?? 'desc'

      const searchResult = await search(location, category, undefined, body.limit ?? 15, sortBy, sortOrder)

      return {
        parsed_query: parsedQuery,
        search_result: searchResult,
        processing_time_ms: Date.now() - startTime,
      }
    } catch (error: any) {
      if (error.name === 'ZodError') {
        reply.code(400).send({ detail: error.errors })
      } else {
        reply.code(500).send({ detail: `Query processing failed: ${error.message}` })
      }
    }
  })
}
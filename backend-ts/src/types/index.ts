import { z } from 'zod'

// 请求验证 Schema
export const SearchRequestSchema = z.object({
  location: z.string().min(1),
  category: z.string().default('美食'),
  limit: z.number().int().positive().default(15),
  sort_by: z.string().nullable().optional(),
  sort_order: z.string().default('desc'),
})

export type SearchRequest = z.infer<typeof SearchRequestSchema>

// 响应类型（与前端共享）
export interface Shop {
  name: string
  province: string
  city: string
  district: string
  address: string
  phone: string
  type: string
  tags: string
  rating: string
  cost: string
  business_hours: string
  location: string
  distance: string
}

export interface SearchResponse {
  total: number
  shops: Shop[]
  center?: string
}

export interface CategoryItem {
  name: string
  type_code: string
}

export type CategoryResponse = CategoryItem[]

// 自然语言查询请求
export const NLQueryRequestSchema = z.object({
  query: z.string().min(1).describe('中文自然语言查询'),
  limit: z.number().int().positive().default(15).optional(),
})

export type NLQueryRequest = z.infer<typeof NLQueryRequestSchema>

// 解析结果
export interface ParsedQuery {
  raw_query: string
  extracted_params: {
    location: string | null
    category: string | null
    sort_by: 'rating' | 'distance' | null
    sort_order: 'asc' | 'desc' | null
    preferences: string[]
  }
  confidence: number
  ambiguity_warning?: string
}

// NL 查询响应
export interface NLQueryResponse {
  parsed_query: ParsedQuery
  search_result: SearchResponse
  processing_time_ms: number
}
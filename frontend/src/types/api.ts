// API请求和响应类型定义（与后端保持一致）

export interface SearchRequest {
  location: string
  category: string
  limit?: number
  sort_by?: string | null
  sort_order?: string
}

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

// 自然语言查询类型
export interface NLQueryRequest {
  query: string
  limit?: number
}

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

export interface NLQueryResponse {
  parsed_query: ParsedQuery
  search_result: SearchResponse
  processing_time_ms: number
}
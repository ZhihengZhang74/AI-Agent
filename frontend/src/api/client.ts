import axios from 'axios'
import type { SearchRequest, SearchResponse, CategoryResponse, NLQueryRequest, NLQueryResponse } from '@/types'

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

export async function getCategories(): Promise<CategoryResponse> {
  const response = await apiClient.get<CategoryResponse>('/categories')
  return response.data
}

export async function searchPlaces(request: SearchRequest): Promise<SearchResponse> {
  const response = await apiClient.post<SearchResponse>('/search', request)
  return response.data
}

export async function understandQuery(request: NLQueryRequest): Promise<NLQueryResponse> {
  const response = await apiClient.post<NLQueryResponse>('/understand', request)
  return response.data
}

export default apiClient
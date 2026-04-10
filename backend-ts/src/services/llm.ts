import axios from 'axios'
import type { ParsedQuery } from '../types'

// 环境变量在函数内部动态读取，确保 dotenv.config() 已执行
function getConfig() {
  return {
    apiKey: process.env.LLM_API_KEY,
    apiUrl: process.env.LLM_API_URL || 'https://api.longcat.chat/openai/v1/chat/completions',
    model: process.env.LLM_MODEL || 'LongCat-Flash-Lite',
  }
}

const AVAILABLE_CATEGORIES = ['美食', '饮品', '咖啡']

const SYSTEM_PROMPT = `You are a query parsing assistant for a location-based store search application.

## Available Categories
- 美食 (Food/Dining)
- 饮品 (Beverages/Drinks)
- 咖啡 (Coffee)

## Available Sort Fields
- rating (评分)
- distance (距离)

## Sort Orders
- asc (ascending/从小到大)
- desc (descending/从高到大)

## Output Format (JSON only):
{
  "location": "extracted location or null",
  "category": "extracted category or null",
  "sort_by": "rating or distance or null",
  "sort_order": "asc or desc or null",
  "preferences": ["list of preferences"],
  "confidence": 0.0-1.0,
  "ambiguity_warning": "optional string"
}`

export async function parseQuery(query: string): Promise<ParsedQuery> {
  const { apiKey, apiUrl, model } = getConfig()

  const response = await axios.post(
    apiUrl,
    {
      model: model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Parse this search query: "${query}"` }
      ],
      max_tokens: 500,
      temperature: 0.1,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      timeout: 30000,
    }
  )

  const text = response.data.choices?.[0]?.message?.content || '{}'

  try {
    const parsed = JSON.parse(text)
    return {
      raw_query: query,
      extracted_params: {
        location: parsed.location ?? null,
        category: normalizeCategory(parsed.category),
        sort_by: normalizeSortField(parsed.sort_by),
        sort_order: normalizeSortOrder(parsed.sort_order),
        preferences: Array.isArray(parsed.preferences) ? parsed.preferences : [],
      },
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      ambiguity_warning: parsed.ambiguity_warning ?? undefined,
    }
  } catch {
    return {
      raw_query: query,
      extracted_params: { location: null, category: null, sort_by: null, sort_order: null, preferences: [] },
      confidence: 0,
      ambiguity_warning: 'Failed to parse LLM response',
    }
  }
}

function normalizeCategory(cat: unknown): string | null {
  if (typeof cat !== 'string') return null
  return AVAILABLE_CATEGORIES.includes(cat.trim()) ? cat.trim() : null
}

function normalizeSortField(field: unknown): 'rating' | 'distance' | null {
  return (field === 'rating' || field === 'distance') ? field : null
}

function normalizeSortOrder(order: unknown): 'asc' | 'desc' | null {
  return (order === 'asc' || order === 'desc') ? order : null
}
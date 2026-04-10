import axios from 'axios'
import type { Shop, CategoryItem } from '../types'

const AMAP_KEY = process.env.AMAP_KEY || '58bf508e6a5afed513df0ece31440c09'
const DEFAULT_RADIUS = 5000
const RETRY_COUNT = 3

const CATEGORY_TYPES: Record<string, string> = {
  '美食': '050000',
  '饮品': '050700',
  '咖啡': '050500',
}

export function getCategoryTypes(): CategoryItem[] {
  return Object.entries(CATEGORY_TYPES).map(([name, type_code]) => ({
    name,
    type_code,
  }))
}

export async function geocode(address: string): Promise<[string, string]> {
  const response = await axios.get('https://restapi.amap.com/v3/geocode/geo', {
    params: { key: AMAP_KEY, address },
  })

  if (response.data.status === '0') {
    throw new Error(`地理编码失败: ${response.data.info || '未知错误'}`)
  }

  const location = response.data.geocodes[0].location
  const [lng, lat] = location.split(',')
  return [lng, lat]
}

async function searchByCategory(
  lng: string,
  lat: string,
  typeCode: string,
  radius: number = DEFAULT_RADIUS,
  limit: number = 15
): Promise<any[]> {
  const allPois: any[] = []
  let page = 1

  for (let attempt = 0; attempt < RETRY_COUNT; attempt++) {
    try {
      while (allPois.length < limit) {
        const response = await axios.get('https://restapi.amap.com/v3/place/around', {
          params: {
            key: AMAP_KEY,
            location: `${lng},${lat}`,
            types: typeCode,
            radius,
            offset: 25,
            page,
            extensions: 'all',
          },
          timeout: 10000,
        })

        if (response.data.status === '0') break

        const pois = response.data.pois || []
        if (pois.length === 0) break

        allPois.push(...pois)
        page++
      }
      break
    } catch (error) {
      if (attempt < RETRY_COUNT - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
        continue
      }
      throw error
    }
  }

  return allPois.slice(0, limit)
}

function formatPoi(poi: any): Shop {
  const cost = poi.biz_ext?.cost || ''
  return {
    name: poi.name || '',
    province: poi.pname || '',
    city: poi.cityname || '',
    district: poi.adname || '',
    address: poi.address || '',
    phone: poi.tel || '',
    type: poi.type || '',
    tags: poi.tag || '',
    rating: poi.biz_ext?.rating || '',
    cost: cost === '[]' ? '' : cost,
    business_hours: poi.biz_ext?.open_time || '',
    location: poi.location || '',
    distance: poi.distance || '',
  }
}

export async function search(
  location: string,
  category: string,
  radius: number = DEFAULT_RADIUS,
  pageSize: number = 15,
  sortBy: string | null = null,
  sortOrder: string = 'desc'
): Promise<{ total: number; shops: Shop[]; center: string }> {
  if (!(category in CATEGORY_TYPES)) {
    throw new Error(`不支持分类: ${category}，可选: ${Object.keys(CATEGORY_TYPES).join(', ')}`)
  }

  const [lng, lat] = await geocode(location)
  const typeCode = CATEGORY_TYPES[category]
  const pois = await searchByCategory(lng, lat, typeCode, radius, pageSize)
  let shops = pois.map(formatPoi)

  // 排序
  if (sortBy) {
    const reverse = sortOrder === 'desc'
    if (sortBy === 'rating') {
      shops.sort((a, b) => {
        const ratingA = parseFloat(a.rating) || 0
        const ratingB = parseFloat(b.rating) || 0
        return reverse ? ratingB - ratingA : ratingA - ratingB
      })
    } else if (sortBy === 'distance') {
      shops.sort((a, b) => {
        const distA = parseInt(a.distance) || Infinity
        const distB = parseInt(b.distance) || Infinity
        return reverse ? distB - distA : distA - distB
      })
    }
  }

  return { total: shops.length, shops, center: `${lng},${lat}` }
}
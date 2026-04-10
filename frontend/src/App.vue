<template>
  <div class="container">
    <div class="header-section">
      <div class="logo-icon">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.88-2.88 7.19-5 10.05C9.92 16.21 7 11.85 7 9z" fill="currentColor"/>
          <circle cx="12" cy="9" r="2.5" fill="currentColor"/>
        </svg>
      </div>
      <h1 class="title">附近店铺查询</h1>
      <p class="subtitle">发现身边的美好</p>
    </div>

    <div class="search-form">
      <el-radio-group v-model="searchMode" size="small">
        <el-radio-button value="structured">结构化搜索</el-radio-button>
        <el-radio-button value="smart">智能搜索</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 智能搜索模式 -->
    <div v-if="searchMode === 'smart'" class="search-form">
      <el-input
        v-model="nlQuery"
        placeholder="输入自然语言查询，如：找个评分高的咖啡店，靠近西湖"
        style="flex: 1"
        @keyup.enter="handleSmartSearch"
      />
      <el-button type="primary" :loading="loading" @click="handleSmartSearch">
        查询
      </el-button>
    </div>

    <!-- 智能搜索历史 -->
    <div v-if="searchMode === 'smart' && searchHistory.length > 0" class="history-section">
      <div class="history-header">
        <span class="history-title">历史搜索</span>
        <el-button link type="primary" size="small" @click="clearHistory">清除</el-button>
      </div>
      <div class="history-tags">
        <el-tag
          v-for="(item, index) in searchHistory"
          :key="index"
          class="history-tag"
          size="small"
          @click="searchFromHistory(item)"
        >
          {{ item }}
        </el-tag>
      </div>
    </div>

    <!-- 结构化搜索模式 -->
    <template v-else>
      <div class="search-form">
        <el-select v-model="category" placeholder="选择分类" style="width: 120px">
          <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
        </el-select>

        <el-select v-model="sortOption" placeholder="排序方式" style="width: 150px">
          <el-option
            v-for="opt in sortOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </div>

      <div class="search-form">
        <el-input
          v-model="location"
          placeholder="输入地址，如：浙江省嵊州市吾悦广场"
          style="flex: 1"
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" :loading="loading" @click="handleSearch">
          查询
        </el-button>
      </div>

      <!-- 结构化搜索历史 -->
      <div v-if="searchHistory.length > 0" class="history-section">
        <div class="history-header">
          <span class="history-title">历史搜索</span>
          <el-button link type="primary" size="small" @click="clearHistory">清除</el-button>
        </div>
        <div class="history-tags">
          <el-tag
            v-for="(item, index) in searchHistory"
            :key="index"
            class="history-tag"
            size="small"
            @click="searchFromHistory(item)"
          >
            {{ item }}
          </el-tag>
        </div>
      </div>
    </template>

    <!-- 显示解析结果 -->
    <div v-if="parsedQuery && searchMode === 'smart'" class="parsed-info">
      <el-alert
        :title="`解析: 位置=${parsedQuery.extracted_params.location || '未指定'}, 分类=${parsedQuery.extracted_params.category || '未指定'}, 排序=${parsedQuery.extracted_params.sort_by || '默认'}`"
        type="info"
        :closable="false"
      />
      <el-alert
        v-if="parsedQuery.ambiguity_warning"
        :title="parsedQuery.ambiguity_warning"
        type="warning"
        :closable="false"
        style="margin-top: 8px;"
      />
    </div>

    <!-- 地图 -->
    <MapView
      v-if="shops.length > 0"
      :shops="shops"
      :center="mapCenter"
      :highlight-index="highlightIndex"
      @shop-click="onMapShopClick"
    />

    <!-- 结果统计 -->
    <div v-if="shops.length > 0" class="result-header">
      {{ searchMode === 'smart' ? (parsedQuery?.extracted_params.category || category) : category }} · 共 {{ total }} 条结果
    </div>

    <!-- 店铺列表 -->
    <div v-if="shops.length > 0" class="shop-list">
      <ShopCard
        v-for="(shop, index) in shops"
        :key="shop.name + shop.address"
        :shop="shop"
        :class="{ 'shop-highlighted': highlightIndex === index }"
        @click="highlightIndex = index"
      />
    </div>

    <el-empty v-if="searched && shops.length === 0 && !loading" description="没有找到相关店铺" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { Shop, SortOption, SortOptionConfig, ParsedQuery } from '@/types'
import { searchPlaces, understandQuery } from '@/api/client'
import ShopCard from './components/ShopCard.vue'
import MapView from './components/MapView.vue'

const categories: string[] = ['美食', '饮品', '咖啡']

const sortOptions: SortOptionConfig[] = [
  { label: '默认排序', value: 'default' },
  { label: '评分从高到低', value: 'rating_desc' },
  { label: '评分从低到高', value: 'rating_asc' },
  { label: '距离从近到远', value: 'distance_asc' },
  { label: '距离从远到近', value: 'distance_desc' },
]

const searchMode = ref<'structured' | 'smart'>('structured')
const category = ref<string>('美食')
const sortOption = ref<SortOption>('default')
const location = ref<string>('浙江省嵊州市吾悦广场')
const nlQuery = ref<string>('')
const shops = ref<Shop[]>([])
const total = ref<number>(0)
const loading = ref<boolean>(false)
const searched = ref<boolean>(false)
const parsedQuery = ref<ParsedQuery | null>(null)
const mapCenter = ref<string | undefined>()
const highlightIndex = ref<number>(-1)

// 搜索历史
const searchHistory = ref<string[]>([])
const HISTORY_KEY = 'shop_search_history'
const MAX_HISTORY = 5

// 从localStorage加载历史记录
onMounted(() => {
  const saved = localStorage.getItem(HISTORY_KEY)
  if (saved) {
    try {
      searchHistory.value = JSON.parse(saved)
    } catch {
      searchHistory.value = []
    }
  }
})

// 保存历史记录到localStorage
function saveHistory() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(searchHistory.value))
}

// 添加历史记录
function addToHistory(query: string) {
  if (!query.trim()) return
  // 移除重复项
  searchHistory.value = searchHistory.value.filter(item => item !== query)
  // 添加到开头
  searchHistory.value.unshift(query)
  // 限制数量
  if (searchHistory.value.length > MAX_HISTORY) {
    searchHistory.value = searchHistory.value.slice(0, MAX_HISTORY)
  }
  saveHistory()
}

// 清除历史记录
function clearHistory() {
  searchHistory.value = []
  localStorage.removeItem(HISTORY_KEY)
}

// 从历史记录搜索
function searchFromHistory(query: string) {
  if (searchMode.value === 'smart') {
    nlQuery.value = query
    handleSmartSearch()
  } else {
    location.value = query
    handleSearch()
  }
}

watch([sortOption, category], () => {
  if (searched.value && location.value.trim() && searchMode.value === 'structured') {
    handleSearch()
  }
})

async function handleSearch(): Promise<void> {
  if (!location.value.trim()) return
  loading.value = true
  searched.value = false
  parsedQuery.value = null
  highlightIndex.value = -1

  let sort_by: string | null = null
  let sort_order: string = 'desc'
  if (sortOption.value !== 'default') {
    const [field, order] = sortOption.value.split('_')
    sort_by = field
    sort_order = order
  }

  try {
    const response = await searchPlaces({
      location: location.value.trim(),
      category: category.value,
      limit: 15,
      sort_by: sort_by,
      sort_order: sort_order,
    })
    shops.value = response.shops
    total.value = response.total
    mapCenter.value = response.center
    // 保存到历史记录
    addToHistory(location.value.trim())
  } catch (err) {
    shops.value = []
    total.value = 0
  } finally {
    loading.value = false
    searched.value = true
  }
}

async function handleSmartSearch(): Promise<void> {
  if (!nlQuery.value.trim()) return
  loading.value = true
  searched.value = false
  highlightIndex.value = -1

  try {
    const response = await understandQuery({ query: nlQuery.value.trim() })
    parsedQuery.value = response.parsed_query
    shops.value = response.search_result.shops
    total.value = response.search_result.total
    mapCenter.value = response.search_result.center
    // 保存到历史记录
    addToHistory(nlQuery.value.trim())
  } catch (err) {
    parsedQuery.value = null
    shops.value = []
    total.value = 0
  } finally {
    loading.value = false
    searched.value = true
  }
}

function onMapShopClick(_shop: Shop, index: number) {
  highlightIndex.value = index
}
</script>

<style scoped>
/* CSS Variables - Warm Cream & Emerald Green Theme */
:root {
  --color-primary: #059669;
  --color-primary-light: #10b981;
  --color-primary-dark: #047857;
  --color-accent: #059669;
  --color-background: #fefbf0;
  --color-surface: #fffef7;
  --color-surface-elevated: #fffef7;
  --color-text: #1a1a1a;
  --color-text-light: #333333;
  --color-text-lighter: #666666;
  --color-success: #22c55e;
  --color-warning: #eab308;
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.12);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.16);
  --radius-sm: 10px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --transition: all 0.25s ease;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
  min-height: 100vh;
  background: var(--color-background);
}

/* Header Section */
.header-section {
  text-align: center;
  margin-bottom: 32px;
  animation: fadeInUp 0.6s ease-out;
  padding: 28px;
  background: var(--color-surface);
  border-radius: 24px;
  box-shadow: var(--shadow-md);
  border: 1px solid #fde68a;
}

.logo-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, var(--color-primary) 0%, #059669 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(5, 150, 105, 0.35);
  color: white;
}

.logo-icon svg {
  width: 32px;
  height: 32px;
}

.title {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 8px;
  letter-spacing: -0.01em;
}

.subtitle {
  font-size: 15px;
  color: var(--color-text-light);
  font-weight: 400;
}

/* Search Form Styles */
.search-form {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  animation: fadeInUp 0.6s ease-out 0.1s both;
  padding: 20px;
  background: #ecfdf5;
  border-radius: 24px;
  box-shadow: var(--shadow-sm);
  border: 1px solid #a7f3d0;
  flex-wrap: wrap;
  align-items: center;
}

.container > .search-form:first-of-type {
  flex-direction: column;
  align-items: stretch;
}

.container > .search-form:first-of-type .el-input {
  width: 100% !important;
}

.search-form :deep(.el-input__wrapper) {
  border-radius: 16px !important;
  box-shadow: none !important;
  border: 1.5px solid #a7f3d0 !important;
  transition: var(--transition) !important;
  padding: 8px 16px !important;
  background: white !important;
}

.search-form :deep(.el-input__wrapper:hover) {
  border-color: var(--color-primary-light) !important;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1) !important;
}

.search-form :deep(.el-input__wrapper.is-focus) {
  border-color: var(--color-primary) !important;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.15) !important;
}

.search-form :deep(.el-input__inner) {
  font-size: 15px !important;
  height: 44px !important;
  color: var(--color-text) !important;
  font-weight: 600 !important;
}

.search-form :deep(.el-input__inner::placeholder) {
  color: var(--color-text-lighter) !important;
  font-weight: 400 !important;
}

.search-form :deep(.el-button--primary) {
  background: #a7f3d0 !important;
  border: none !important;
  border-color: #a7f3d0 !important;
  border-radius: 16px !important;
  height: 52px !important;
  padding: 0 32px !important;
  font-size: 16px !important;
  font-weight: 700 !important;
  color: #047857 !important;
  box-shadow: 0 2px 8px rgba(5, 150, 105, 0.2) !important;
  transition: var(--transition) !important;
}

.search-form :deep(.el-button--primary:hover) {
  background: #86efac !important;
  border-color: #86efac !important;
  color: #047857 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25) !important;
}

.search-form :deep(.el-select .el-input__wrapper) {
  border-radius: 16px !important;
}

/* Radio Group */
.search-form :deep(.el-radio-button__inner) {
  background: var(--color-surface-elevated) !important;
  border-color: #f5e6d3 !important;
  color: var(--color-text-light) !important;
  font-weight: 500 !important;
  transition: var(--transition) !important;
  border-radius: 16px !important;
}

.search-form :deep(.el-radio-button__inner:hover) {
  color: var(--color-primary) !important;
  border-color: var(--color-primary-light) !important;
}

.search-form :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: #10b981 !important;
  border-color: #10b981 !important;
  color: white !important;
  box-shadow: none !important;
}

/* Result Header */
.result-header {
  font-size: 17px;
  color: var(--color-text);
  margin: 28px 0 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: fadeInUp 0.5s ease-out 0.2s both;
  padding: 14px 20px;
  background: var(--color-surface);
  border-radius: 20px;
  box-shadow: var(--shadow-sm);
  border: 1px solid #fde68a;
}

.result-header::before {
  content: '';
  display: inline-block;
  width: 5px;
  height: 22px;
  background: #10b981;
  border-radius: 3px;
}

/* Shop List */
.shop-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.shop-list > * {
  animation: fadeInUp 0.5s ease-out both;
}

.shop-list > *:nth-child(1) { animation-delay: 0.25s; }
.shop-list > *:nth-child(2) { animation-delay: 0.3s; }
.shop-list > *:nth-child(3) { animation-delay: 0.35s; }
.shop-list > *:nth-child(4) { animation-delay: 0.4s; }
.shop-list > *:nth-child(5) { animation-delay: 0.45s; }
.shop-list > *:nth-child(n+6) { animation-delay: 0.5s; }

/* Parsed Info */
.parsed-info {
  margin-bottom: 20px;
  animation: fadeInUp 0.5s ease-out 0.2s both;
  padding: 14px;
  background: var(--color-surface);
  border-radius: 20px;
  box-shadow: var(--shadow-sm);
  border: 1px solid #fef3c7;
}

.parsed-info :deep(.el-alert) {
  border-radius: var(--radius-sm) !important;
  border: none !important;
}

.parsed-info :deep(.el-alert--info) {
  background: #ecfdf5 !important;
  color: #047857 !important;
}

.parsed-info :deep(.el-alert--warning) {
  background: #fef9c3 !important;
  color: #92400e !important;
}

/* Shop Highlighted */
.shop-highlighted {
  outline: 3px solid var(--color-primary-light) !important;
  outline-offset: 2px;
  border-radius: var(--radius-lg) !important;
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Map Container */
:deep(.map-container) {
  border-radius: 24px !important;
  overflow: hidden;
  box-shadow: var(--shadow-md) !important;
  margin-bottom: 28px !important;
  animation: fadeInUp 0.6s ease-out 0.2s both;
  border: 1px solid #fef3c7;
}

/* Empty State */
:deep(.el-empty) {
  padding: 48px 0 !important;
  background: var(--color-surface);
  border-radius: 24px;
  box-shadow: var(--shadow-sm);
  margin-top: 24px;
  border: 1px solid #fef3c7;
}

:deep(.el-empty__description) {
  color: var(--color-text-light) !important;
  font-size: 15px !important;
  margin-top: 16px !important;
}

/* History Section */
.history-section {
  margin-bottom: 16px;
  padding: 16px;
  background: var(--color-surface);
  border-radius: 20px;
  border: 1px solid #fde68a;
  box-shadow: var(--shadow-sm);
  animation: fadeInUp 0.5s ease-out 0.15s both;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.history-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-light);
  display: flex;
  align-items: center;
  gap: 6px;
}

.history-title::before {
  content: '';
  display: inline-block;
  width: 5px;
  height: 5px;
  background: var(--color-primary);
  border-radius: 50%;
}

.history-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.history-section :deep(.history-tag) {
  background: #ecfdf5 !important;
  border: 1.5px solid #a7f3d0 !important;
  color: var(--color-primary-dark) !important;
  border-radius: 24px !important;
  padding: 8px 16px !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  cursor: pointer !important;
  transition: var(--transition) !important;
}

.history-section :deep(.history-tag:hover) {
  background: #10b981 !important;
  color: white !important;
  border-color: #10b981 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 8px rgba(5, 150, 105, 0.25) !important;
}
</style>
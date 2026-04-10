<template>
  <el-card shadow="hover" class="shop-card">
    <div class="shop-content">
      <!-- 评分徽章 -->
      <div class="rating-badge" :class="ratingClass" v-if="shop.rating">
        <span class="rating-score">{{ shop.rating }}</span>
        <span class="rating-stars">{{ ratingStars }}</span>
      </div>

      <div class="shop-header">
        <span class="shop-name">{{ shop.name }}</span>
        <div class="shop-tags" v-if="shop.type">
          <span class="shop-tag">{{ shop.type }}</span>
        </div>
      </div>

      <div class="shop-meta">
        <div class="meta-item" v-if="shop.cost">
          <span class="meta-icon">💰</span>
          <span class="meta-text">人均 ¥{{ shop.cost }}</span>
        </div>
        <div class="meta-item" v-if="shop.distance">
          <span class="meta-icon">📍</span>
          <span class="meta-text">{{ formatDistance(shop.distance) }}</span>
        </div>
      </div>

      <div class="shop-address" v-if="shop.address">
        <span class="address-icon">🏠</span>
        <span>{{ shop.address }}</span>
      </div>

      <div class="shop-footer" v-if="shop.phone || shop.business_hours">
        <div class="footer-item" v-if="shop.phone">
          <span class="footer-icon">📞</span>
          <span>{{ shop.phone }}</span>
        </div>
        <div class="footer-item hours" v-if="shop.business_hours">
          <span class="footer-icon">🕐</span>
          <span>{{ shop.business_hours }}</span>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Shop } from '@/types'

interface Props {
  shop: Shop
}

const props = defineProps<Props>()

const ratingClass = computed(() => {
  const rating = parseFloat(props.shop.rating)
  if (!rating) return ''
  if (rating >= 4.5) return 'excellent'
  if (rating >= 4.0) return 'good'
  if (rating >= 3.5) return 'average'
  return 'poor'
})

const ratingStars = computed(() => {
  const rating = parseFloat(props.shop.rating)
  if (!rating) return ''
  const fullStars = Math.floor(rating)
  const halfStar = rating % 1 >= 0.5 ? 1 : 0
  return '★'.repeat(fullStars) + (halfStar ? '½' : '')
})

function formatDistance(distance: string): string {
  const dist = parseInt(distance)
  if (isNaN(dist)) return distance
  if (dist >= 1000) {
    return `${(dist / 1000).toFixed(1)}km`
  }
  return `${dist}m`
}
</script>

<style scoped>
.shop-card {
  margin-bottom: 0;
  cursor: pointer;
  border-radius: 20px !important;
  border: none !important;
  background: white !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  overflow: visible !important;
  position: relative;
}

.shop-card:hover {
  transform: translateY(-4px) !important;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25) !important;
}

.shop-card :deep(.el-card__body) {
  padding: 24px !important;
}

.shop-content {
  position: relative;
}

/* Rating Badge */
.rating-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  color: white;
  padding: 8px 12px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 56px;
  z-index: 10;
}

.rating-badge.excellent {
  background: linear-gradient(135deg, #4ADE80 0%, #22C55E 100%);
  box-shadow: 0 4px 12px rgba(74, 222, 128, 0.4);
}

.rating-badge.good {
  background: linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%);
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
}

.rating-badge.average {
  background: linear-gradient(135deg, #FB923C 0%, #F97316 100%);
  box-shadow: 0 4px 12px rgba(251, 146, 60, 0.4);
}

.rating-badge.poor {
  background: linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%);
  box-shadow: 0 4px 12px rgba(156, 163, 175, 0.4);
}

.rating-score {
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
}

.rating-stars {
  font-size: 10px;
  opacity: 0.9;
  letter-spacing: 1px;
  margin-top: 2px;
}

/* Shop Header */
.shop-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
  padding-right: 60px;
}

.shop-name {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.3;
  letter-spacing: -0.01em;
}

.shop-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.shop-tag {
  background: rgba(5, 150, 105, 0.12);
  color: #047857;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

/* Shop Meta */
.shop-meta {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #1a1a1a;
  font-size: 14px;
}

.meta-icon {
  font-size: 16px;
}

.meta-text {
  font-weight: 700;
}

/* Shop Address */
.shop-address {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #1a1a1a;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 16px;
  padding: 12px;
  background: #ecfdf5;
  border-radius: 12px;
}

.address-icon {
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 1px;
}

/* Shop Footer */
.shop-footer {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  padding-top: 16px;
  border-top: 1px solid #E5E7EB;
}

.footer-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #1a1a1a;
  font-weight: 600;
}

.footer-item.hours {
  color: #059669;
  font-weight: 700;
}

.footer-icon {
  font-size: 14px;
}

/* Empty States */
.shop-card :deep(.el-tag--info) {
  background: #F3F4F6 !important;
  color: #6B7280 !important;
  border: none !important;
}
</style>
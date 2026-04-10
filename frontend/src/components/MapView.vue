<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import AMapLoader from '@amap/amap-jsapi-loader'
import type { Shop } from '@/types'

interface Props {
  shops: Shop[]
  center?: string
  highlightIndex?: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'shopClick', shop: Shop, index: number): void
}>()

const mapContainer = ref<HTMLDivElement>()
let map: any = null
let AMapRef: any = null
let markers: any[] = []
let infoWindow: any = null

// 分类对应的颜色
const categoryColors: Record<string, string> = {
  '美食': '#F56C6C',
  '饮品': '#409EFF',
  '咖啡': '#E6A23C',
}

function getCategoryColor(shop: Shop): string {
  const type = shop.type || ''
  if (type.includes('咖啡') || type.includes('咖啡厅')) return categoryColors['咖啡']
  if (type.includes('饮品') || type.includes('奶茶') || type.includes('茶')) return categoryColors['饮品']
  return categoryColors['美食']
}

async function initMap() {
  try {
    AMapRef = await AMapLoader.load({
      key: import.meta.env.VITE_AMAP_JS_KEY,
      version: '2.0',
    })

    map = new AMapRef.Map(mapContainer.value, {
      zoom: 13,
      center: [120.5, 30.0],
      mapStyle: 'amap://styles/normal',
    })

    infoWindow = new AMapRef.InfoWindow({
      offset: new AMapRef.Pixel(0, -30),
    })

    updateMarkers()
  } catch (e) {
    console.error('地图加载失败:', e)
  }
}

function updateMarkers() {
  if (!map || !AMapRef) return

  // 清除旧标记
  markers.forEach(m => map.remove(m))
  markers = []

  if (props.shops.length === 0) return

  markers = props.shops.map((shop, index) => {
    if (!shop.location) return null

    const [lng, lat] = shop.location.split(',').map(Number)
    if (isNaN(lng) || isNaN(lat)) return null

    const color = getCategoryColor(shop)

    const marker = new AMapRef.Marker({
      position: [lng, lat],
      title: shop.name,
      label: {
        content: `<div style="background:${color};color:#fff;padding:2px 6px;border-radius:10px;font-size:12px;white-space:nowrap;">${shop.name}</div>`,
        direction: 'top',
        offset: new AMapRef.Pixel(0, -5),
      },
    })

    marker.on('click', () => {
      const content = `
        <div style="padding:8px;min-width:180px;">
          <h4 style="margin:0 0 6px 0;font-size:14px;">${shop.name}</h4>
          ${shop.rating ? `<div style="color:#E6A23C;font-size:13px;">⭐ ${shop.rating}分</div>` : ''}
          ${shop.cost ? `<div style="color:#909399;font-size:12px;">人均 ¥${shop.cost}</div>` : ''}
          ${shop.distance ? `<div style="color:#909399;font-size:12px;">距离 ${shop.distance}m</div>` : ''}
          ${shop.address ? `<div style="color:#909399;font-size:12px;margin-top:4px;">${shop.address}</div>` : ''}
        </div>
      `
      infoWindow.setContent(content)
      infoWindow.open(map, [lng, lat])
      emit('shopClick', shop, index)
    })

    map.add(marker)
    return marker
  }).filter(Boolean)

  // 自动调整视野
  if (markers.length > 0) {
    map.setFitView(markers, false, [60, 60, 60, 60])
  }
}

// 高亮某个店铺
watch(() => props.highlightIndex, (newIdx) => {
  if (newIdx === undefined || newIdx < 0 || !map) return
  const shop = props.shops[newIdx]
  if (!shop?.location) return

  const [lng, lat] = shop.location.split(',').map(Number)
  if (isNaN(lng) || isNaN(lat)) return

  map.setZoomAndCenter(16, [lng, lat], false, 300)

  // 打开信息窗口
  const content = `
    <div style="padding:8px;min-width:180px;">
      <h4 style="margin:0 0 6px 0;font-size:14px;">${shop.name}</h4>
      ${shop.rating ? `<div style="color:#E6A23C;font-size:13px;">⭐ ${shop.rating}分</div>` : ''}
      ${shop.cost ? `<div style="color:#909399;font-size:12px;">人均 ¥${shop.cost}</div>` : ''}
      ${shop.distance ? `<div style="color:#909399;font-size:12px;">距离 ${shop.distance}m</div>` : ''}
      ${shop.address ? `<div style="color:#909399;font-size:12px;margin-top:4px;">${shop.address}</div>` : ''}
    </div>
  `
  infoWindow?.setContent(content)
  infoWindow?.open(map, [lng, lat])
})

// 中心点变化时移动地图
watch(() => props.center, (newCenter) => {
  if (!map || !newCenter) return
  const [lng, lat] = newCenter.split(',').map(Number)
  if (isNaN(lng) || isNaN(lat)) return
  map.setCenter([lng, lat])
})

// 店铺变化时更新标记
watch(() => props.shops, () => {
  nextTick(() => {
    updateMarkers()
  })
}, { deep: true })

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  markers.forEach(m => map?.remove(m))
  markers = []
  map?.destroy()
  map = null
})
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
}
</style>
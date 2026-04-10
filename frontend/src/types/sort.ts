// 排序选项类型定义

export type SortOption =
  | 'default'
  | 'rating_desc'
  | 'rating_asc'
  | 'distance_asc'
  | 'distance_desc'

export interface SortOptionConfig {
  label: string
  value: SortOption
}
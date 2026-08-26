/* eslint-disable prettier/prettier */
// Beautiful curated color palette spanning across hues (including all seed colors)
export const COLOR_PALETTE = [
  // Indigos, Theme & Royal Blues
  '#6366F1', '#4F46E5', '#4338CA', '#3730A3', '#3B82F6', '#2563EB', '#1D4ED8',
  // Blues & Sky
  '#74C0FC', '#339AF0', '#228BE6', '#1C7ED6', '#1864AB', '#0284C7', '#0EA5E9',
  // Cyans & Teals
  '#66D9E8', '#3BC9DB', '#15AABF', '#0C8599', '#087F5B', '#06B6D4', '#14B8A6',
  // Greens & Emeralds
  '#63E6BE', '#38D9A9', '#12B886', '#0CA678', '#10B981', '#059669', '#2F9E44',
  // Limes & Olives
  '#C0EB75', '#94D82D', '#74B816', '#5C940D', '#66A80F', '#84CC16',
  // Yellows & Ambers
  '#FFE066', '#FFD43B', '#FCC419', '#F59F00', '#F08C00', '#F59E0B', '#EAB308',
  // Oranges & Warm Tones
  '#FFD8A8', '#FFA94D', '#FF922B', '#FD7E14', '#F97316', '#EA580C', '#D9480F',
  // Reds & Corals
  '#FF6B6B', '#FA5252', '#EF4444', '#E03131', '#DC2626', '#C22525', '#F43F5E',
  // Pinks & Roses
  '#F783AC', '#E64980', '#EC4899', '#DB2777', '#D01B5E', '#C2185B', '#E11D48',
  // Purples & Violets
  '#B197FC', '#9775FA', '#8B5CF6', '#845EF7', '#7C3AED', '#7048E8', '#6D28D9',
  // Slates, Grays & Neutrals
  '#CED4DA', '#ADB5BD', '#868E96', '#64748B', '#495057', '#475569', '#334155'
] as const

export const DEFAULT_COLOR = COLOR_PALETTE[0] || '#6366F1'

export type ColorItem = (typeof COLOR_PALETTE)[number]

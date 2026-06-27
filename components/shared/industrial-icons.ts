import {
  BadgeCheck,
  Boxes,
  Factory,
  Flame,
  Gauge,
  Layers3,
  Network,
  PackageCheck,
  SlidersHorizontal,
  Thermometer,
  ToggleLeft,
  Waves,
  Wind,
  type LucideIcon,
} from 'lucide-react'
import type { IndustrialIconKey } from '@/lib/domain'

export function getIndustrialIcon(key: IndustrialIconKey): LucideIcon {
  const icons: Record<IndustrialIconKey, LucideIcon> = {
    pressure: Gauge,
    level: Waves,
    temperature: Thermometer,
    switch: ToggleLeft,
    factory: Factory,
    water: Waves,
    hvac: Wind,
    energy: Flame,
    chemical: SlidersHorizontal,
    oem: PackageCheck,
    quality: BadgeCheck,
    catalog: Boxes,
    pipeline: Network,
  }

  return icons[key] ?? Layers3
}

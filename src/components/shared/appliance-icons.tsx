import * as React from 'react'
import {
  resolveApplianceIconKey,
  type ApplianceIconKey,
} from '@/lib/constants'
import { cn } from '@/lib/utils'

interface ApplianceIllustrationProps {
  iconKey: ApplianceIconKey
  isActive?: boolean
  className?: string
}

export function ApplianceIllustration({
  iconKey,
  isActive = false,
  className,
}: ApplianceIllustrationProps) {
  const outline = isActive ? '#0B3B36' : '#141B29'
  const accent = isActive ? '#0F766E' : '#141B29'
  const svgClass = cn('h-20 w-20 sm:h-24 sm:w-24', className)

  switch (iconKey) {
    case 'split-aircon':
      return (
        <svg viewBox="0 0 120 120" fill="none" className={svgClass} aria-hidden="true">
          <rect x="12" y="26" width="96" height="44" rx="8" fill="#FFFFFF" stroke={outline} strokeWidth="2.4" />
          <path
            d="M17 33a3 3 0 0 1 3-3h80a3 3 0 0 1 3 3v6H17v-6Z"
            fill={isActive ? '#CCFBF1' : '#E6E1D6'}
          />
          <rect x="81" y="42" width="16" height="6" rx="2" fill={accent} />
          <circle cx="74" cy="45" r="2.4" fill="#0F766E" />
          <rect x="18" y="55" width="84" height="10" rx="3" fill={accent} />
          <rect x="22" y="59" width="76" height="3.2" rx="1.6" fill="#FFFFFF" />
          <path
            d="M32 76c-2 6-6 11-9 15M46 76c-1 7-3 13-5 18M60 76v19M74 76c1 7 3 13 5 18M88 76c2 6 6 11 9 15"
            stroke={isActive ? '#FFFFFF' : '#0F766E'}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </svg>
      )

    case 'window-aircon':
      return (
        <svg viewBox="0 0 120 120" fill="none" className={svgClass} aria-hidden="true">
          <rect x="13" y="25" width="94" height="66" rx="7" fill="#FFFFFF" stroke={outline} strokeWidth="2.4" />
          <rect x="19" y="32" width="56" height="52" rx="4" fill={accent} />
          <rect x="23" y="37" width="48" height="4.2" rx="2" fill="#FFFFFF" />
          <rect x="23" y="45" width="48" height="4.2" rx="2" fill="#FFFFFF" />
          <rect x="23" y="53" width="48" height="4.2" rx="2" fill="#FFFFFF" />
          <rect x="23" y="61" width="48" height="4.2" rx="2" fill="#FFFFFF" />
          <rect x="23" y="69" width="48" height="4.2" rx="2" fill="#FFFFFF" />
          <rect x="80" y="32" width="21" height="52" rx="4" fill={isActive ? '#CCFBF1' : '#E6E1D6'} stroke={outline} strokeWidth="1.6" />
          <circle cx="90.5" cy="46" r="5.5" fill={accent} />
          <circle cx="90.5" cy="63" r="5.5" fill={accent} />
          <rect x="85" y="75" width="11" height="3.5" rx="1.75" fill="#B45309" />
        </svg>
      )

    case 'refrigerator':
      return (
        <svg viewBox="0 0 120 120" fill="none" className={svgClass} aria-hidden="true">
          <rect x="40" y="102" width="8" height="5" rx="2" fill={outline} />
          <rect x="72" y="102" width="8" height="5" rx="2" fill={outline} />
          <rect x="33" y="14" width="54" height="31" rx="6" fill="#FFFFFF" stroke={outline} strokeWidth="2.4" />
          <rect x="33" y="48" width="54" height="55" rx="6" fill="#FFFFFF" stroke={outline} strokeWidth="2.4" />
          <rect x="33" y="44.5" width="54" height="4" fill={accent} />
          <rect x="39" y="23" width="4.5" height="15" rx="2.25" fill={accent} />
          <rect x="39" y="56" width="4.5" height="24" rx="2.25" fill={accent} />
          <rect x="64" y="23" width="15" height="11" rx="2.5" fill={isActive ? '#CCFBF1' : '#E6E1D6'} stroke={outline} strokeWidth="1.5" />
          <circle cx="71.5" cy="28.5" r="2.5" fill={accent} />
        </svg>
      )

    case 'washing-machine':
      return (
        <svg viewBox="0 0 120 120" fill="none" className={svgClass} aria-hidden="true">
          <rect x="23" y="16" width="74" height="88" rx="7" fill="#FFFFFF" stroke={outline} strokeWidth="2.4" />
          <path
            d="M24 23a6 6 0 0 1 6-6h60a6 6 0 0 1 6 6v14H24V23Z"
            fill={isActive ? '#CCFBF1' : '#E6E1D6'}
          />
          <path d="M24 37h72" stroke={outline} strokeWidth="2" />
          <rect x="31" y="22" width="18" height="8" rx="2" fill="#FFFFFF" stroke={outline} strokeWidth="1.5" />
          <circle cx="60" cy="26" r="5" fill={accent} />
          <circle cx="77" cy="26" r="2.7" fill="#B45309" />
          <circle cx="85" cy="26" r="2.7" fill={accent} />
          <circle cx="60" cy="69" r="24" fill={isActive ? '#CCFBF1' : '#E6E1D6'} stroke={outline} strokeWidth="2" />
          <circle cx="60" cy="69" r="17" fill={accent} />
          <path
            d="M44 70c4-4 10-4 16 0s12 4 16 0a16.5 16.5 0 0 1-32 0Z"
            fill="#38BDF8"
          />
        </svg>
      )

    case 'top-load-washer':
      return (
        <svg viewBox="0 0 120 120" fill="none" className={svgClass} aria-hidden="true">
          <path
            d="M26 24a6 6 0 0 1 6-6h56a6 6 0 0 1 6 6v12H26V24Z"
            fill={isActive ? '#CCFBF1' : '#E6E1D6'}
            stroke={outline}
            strokeWidth="2.4"
          />
          <circle cx="38" cy="27" r="3.2" fill={accent} />
          <circle cx="48" cy="27" r="2.4" fill="#B45309" />
          <rect x="57" y="23.5" width="26" height="7" rx="2" fill="#FFFFFF" stroke={outline} strokeWidth="1.5" />
          <rect x="24" y="36" width="72" height="68" rx="7" fill="#FFFFFF" stroke={outline} strokeWidth="2.4" />
          <rect x="32" y="42" width="56" height="10" rx="3" fill={accent} />
          <rect x="48" y="45.5" width="24" height="3" rx="1.5" fill="#FFFFFF" />
          <rect x="34" y="58" width="52" height="34" rx="5" fill={isActive ? '#CCFBF1' : '#E6E1D6'} stroke={outline} strokeWidth="1.8" />
          <path
            d="M40 77c5-4 11-4 20 0s15 4 20 0v9a3 3 0 0 1-3 3H43a3 3 0 0 1-3-3v-9Z"
            fill="#38BDF8"
          />
        </svg>
      )

    case 'cooking-range':
      return (
        <svg viewBox="0 0 120 120" fill="none" className={svgClass} aria-hidden="true">
          <rect x="26" y="14" width="68" height="10" rx="3" fill={isActive ? '#CCFBF1' : '#E6E1D6'} stroke={outline} strokeWidth="2" />
          <rect x="32" y="21" width="16" height="4" rx="1.5" fill={accent} />
          <rect x="72" y="21" width="16" height="4" rx="1.5" fill={accent} />
          <rect x="22" y="25" width="76" height="80" rx="6" fill="#FFFFFF" stroke={outline} strokeWidth="2.4" />
          <rect x="24" y="27" width="72" height="15" rx="3" fill={isActive ? '#CCFBF1' : '#E6E1D6'} />
          <circle cx="35" cy="34.5" r="3.8" fill={accent} />
          <circle cx="51" cy="34.5" r="3.8" fill={accent} />
          <circle cx="69" cy="34.5" r="3.8" fill={accent} />
          <circle cx="85" cy="34.5" r="3.8" fill={accent} />
          <rect x="32" y="48" width="56" height="4.5" rx="2" fill={outline} />
          <rect x="32" y="56" width="56" height="38" rx="4" fill={accent} />
          <path d="M40 76h40" stroke="#FBBF24" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      )

    case 'commercial-chiller':
      return (
        <svg viewBox="0 0 120 120" fill="none" className={svgClass} aria-hidden="true">
          <rect x="29" y="13" width="62" height="94" rx="6" fill="#FFFFFF" stroke={outline} strokeWidth="2.4" />
          <rect x="35" y="18" width="50" height="11" rx="2.5" fill={isActive ? '#CCFBF1' : '#E6E1D6'} stroke={outline} strokeWidth="1.5" />
          <rect x="35" y="33" width="44" height="58" rx="3.5" fill={accent} />
          <rect x="38" y="49" width="38" height="2.8" rx="1" fill="#FFFFFF" />
          <rect x="38" y="66" width="38" height="2.8" rx="1" fill="#FFFFFF" />
          <rect x="38" y="83" width="38" height="2.8" rx="1" fill="#FFFFFF" />
          <rect x="43" y="38" width="6" height="11" rx="2" fill="#38BDF8" />
          <rect x="53" y="38" width="6" height="11" rx="2" fill="#99F6E4" />
          <rect x="63" y="38" width="6" height="11" rx="2" fill="#38BDF8" />
          <rect x="43" y="55" width="7" height="11" rx="2" fill="#99F6E4" />
          <rect x="55" y="55" width="7" height="11" rx="2" fill="#38BDF8" />
          <rect x="82" y="46" width="4" height="28" rx="2" fill={outline} />
          <rect x="35" y="95" width="50" height="6" rx="2" fill={isActive ? '#CCFBF1' : '#E6E1D6'} stroke={outline} strokeWidth="1.5" />
        </svg>
      )

    case 'microwave-oven':
      return (
        <svg viewBox="0 0 120 120" fill="none" className={svgClass} aria-hidden="true">
          <rect x="20" y="90" width="12" height="5" rx="2" fill={outline} />
          <rect x="88" y="90" width="12" height="5" rx="2" fill={outline} />
          <rect x="13" y="31" width="94" height="59" rx="7" fill="#FFFFFF" stroke={outline} strokeWidth="2.4" />
          <rect x="20" y="39" width="56" height="43" rx="4" fill={accent} />
          <rect x="28" y="72" width="40" height="3.5" rx="1.75" fill="#99F6E4" />
          <rect x="70" y="47" width="3.5" height="27" rx="1.75" fill="#FFFFFF" />
          <rect x="81" y="39" width="19" height="43" rx="3.5" fill={isActive ? '#CCFBF1' : '#E6E1D6'} stroke={outline} strokeWidth="1.5" />
          <rect x="84" y="43" width="13" height="7" rx="1.5" fill={accent} />
          <circle cx="87.5" cy="56" r="2" fill={outline} />
          <circle cx="93.5" cy="56" r="2" fill={outline} />
          <circle cx="87.5" cy="63" r="2" fill={outline} />
          <circle cx="93.5" cy="63" r="2" fill={outline} />
          <rect x="84" y="71" width="13" height="6.5" rx="2" fill="#B45309" />
        </svg>
      )

    case 'water-dispenser':
      return (
        <svg viewBox="0 0 120 120" fill="none" className={svgClass} aria-hidden="true">
          <rect x="41" y="10" width="38" height="32" rx="7" fill="#7DD3FC" stroke={outline} strokeWidth="2.2" />
          <path d="M41 24h38" stroke="#FFFFFF" strokeWidth="2.5" />
          <rect x="51" y="40" width="18" height="5" rx="1.5" fill="#E6E1D6" stroke={outline} strokeWidth="1.8" />
          <rect x="33" y="44" width="54" height="63" rx="6" fill="#FFFFFF" stroke={outline} strokeWidth="2.4" />
          <rect x="39" y="51" width="42" height="27" rx="3.5" fill={accent} />
          <rect x="47" y="51" width="7" height="10" rx="2" fill="#E11D48" />
          <rect x="66" y="51" width="7" height="10" rx="2" fill="#38BDF8" />
          <rect x="42" y="73" width="36" height="4" rx="1.5" fill="#FFFFFF" />
          <rect x="39" y="83" width="42" height="18" rx="3" fill={isActive ? '#CCFBF1' : '#E6E1D6'} stroke={outline} strokeWidth="1.5" />
        </svg>
      )

    case 'television':
      return (
        <svg viewBox="0 0 120 120" fill="none" className={svgClass} aria-hidden="true">
          <rect x="14" y="24" width="92" height="58" rx="6" fill="#FFFFFF" stroke={outline} strokeWidth="2.4" />
          <rect x="20" y="30" width="80" height="46" rx="3.5" fill={accent} />
          <path d="M32 64c10-12 20-16 32-12 10 3 17 0 24-8" stroke="#99F6E4" strokeWidth="3.2" strokeLinecap="round" />
          <circle cx="91" cy="79" r="2.2" fill="#D97706" />
          <rect x="54" y="82" width="12" height="10" fill={outline} />
          <rect x="38" y="92" width="44" height="5" rx="2.5" fill={outline} />
        </svg>
      )

    case 'clothes-dryer':
      return (
        <svg viewBox="0 0 120 120" fill="none" className={svgClass} aria-hidden="true">
          <rect x="23" y="16" width="74" height="88" rx="7" fill="#FFFFFF" stroke={outline} strokeWidth="2.4" />
          <path d="M24 23a6 6 0 0 1 6-6h60a6 6 0 0 1 6 6v14H24V23Z" fill={isActive ? '#CCFBF1' : '#E6E1D6'} />
          <path d="M24 37h72" stroke={outline} strokeWidth="2" />
          <circle cx="43" cy="27" r="4.5" fill={accent} />
          <rect x="58" y="23" width="26" height="8" rx="2" fill="#FFFFFF" stroke={outline} strokeWidth="1.5" />
          <circle cx="60" cy="69" r="23" fill={isActive ? '#CCFBF1' : '#E6E1D6'} stroke={outline} strokeWidth="2" />
          <circle cx="60" cy="69" r="16" fill={accent} />
          <path d="M51 66c3-5 11-5 14 0m-14 7c3 5 11 5 14 0" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )

    case 'electric-fan':
      return (
        <svg viewBox="0 0 120 120" fill="none" className={svgClass} aria-hidden="true">
          <circle cx="60" cy="45" r="29" fill="#FFFFFF" stroke={outline} strokeWidth="2.4" />
          <circle cx="60" cy="45" r="22" fill={isActive ? '#CCFBF1' : '#E6E1D6'} stroke={outline} strokeWidth="1.6" />
          <path d="M60 45c-6-13 6-18 9-7 3 10-9 7-9 7Zm0 0c13-4 17 7 6 10-10 3-6-10-6-10Zm0 0c5 13-7 17-10 6-3-10 10-6 10-6Zm0 0c-13 4-17-7-6-10 10-3 6 10 6 10Z" fill={accent} />
          <circle cx="60" cy="45" r="5" fill="#FFFFFF" stroke={outline} strokeWidth="2" />
          <rect x="57" y="74" width="6" height="22" fill={outline} />
          <rect x="38" y="96" width="44" height="9" rx="4.5" fill={accent} />
          <circle cx="52" cy="100.5" r="2" fill="#FFFFFF" />
          <circle cx="60" cy="100.5" r="2" fill="#FFFFFF" />
          <circle cx="68" cy="100.5" r="2" fill="#FBBF24" />
        </svg>
      )

    case 'water-heater':
      return (
        <svg viewBox="0 0 120 120" fill="none" className={svgClass} aria-hidden="true">
          <rect x="33" y="18" width="54" height="68" rx="10" fill="#FFFFFF" stroke={outline} strokeWidth="2.4" />
          <rect x="42" y="28" width="36" height="16" rx="4" fill={isActive ? '#CCFBF1' : '#E6E1D6'} stroke={outline} strokeWidth="1.5" />
          <circle cx="60" cy="60" r="10" fill={accent} />
          <path d="M60 54v6l4 2" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="48" cy="36" r="2.8" fill="#E11D48" />
          <rect x="56" y="34.5" width="16" height="3" rx="1.5" fill={accent} />
          <path d="M48 86v18M72 86v12c0 4 5 6 8 6" stroke={outline} strokeWidth="3.2" strokeLinecap="round" />
          <circle cx="80" cy="104" r="3" fill="#38BDF8" stroke={outline} strokeWidth="1.5" />
        </svg>
      )
  }
}

interface ApplianceIconProps {
  icon?: string | null
  category?: string | null
  isActive?: boolean
  className?: string
}

export function ApplianceIcon({
  icon,
  category,
  isActive = false,
  className = 'h-10 w-10',
}: ApplianceIconProps) {
  const key = resolveApplianceIconKey(icon, category)
  return <ApplianceIllustration iconKey={key} isActive={isActive} className={className} />
}

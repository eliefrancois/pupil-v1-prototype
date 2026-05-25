/**
 * Pupil email theme. Pulled from app/globals.css so emails track the brand
 * colors. Keep these as plain hex strings — email clients don't understand
 * CSS custom properties.
 */
export const colors = {
  primary: '#7A60E4',
  primaryHover: '#6B4FD1',
  primaryLight: '#EDE8FB',
  primarySoft: '#F5F1FE',
  primaryForeground: '#FFFFFF',

  // Surfaces
  bg: '#FFFFFF',
  bgPage: '#F7F5F2', // editorial off-white
  bgSubtle: '#F4F2EE',
  border: '#E5E1DA',
  borderStrong: '#D1CDC4',

  // Text
  text: '#1A1815',
  text2: '#4A4640',
  text3: '#807A70',

  // Status
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#B91C1C',
} as const

export const fonts = {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", Arial, sans-serif',
  serif: 'Georgia, "Times New Roman", Times, serif',
} as const

import { getSiteUrl } from '@/lib/site-url'

export const SITE_URL = getSiteUrl()

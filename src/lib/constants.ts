import type { Flavor, TimeSlot } from './types'

export const ADMIN_PW = 'Elevbedriftyogurt1'

export const DEFAULT_FLAVORS: Flavor[] = [
  {
    emoji: '🍦', name: 'Classic Vanilla', badge: 'Kremet', pris: '25 kr', sted: 'Kantina',
    desc: 'En klassisk favoritt med ekte vaniljesmak og silkemyk tekstur.',
    available: true, g1: '#FEF9C3', g2: '#F5D06B', tc: '#3B2208', tc2: '#A06020',
  },
  {
    emoji: '🥭', name: 'Mango Delight', badge: 'Fruktig', pris: '25 kr', sted: 'Kantina',
    desc: 'Søt og saftig mango rørt inn i en kremet isbase.',
    available: true, g1: '#FFEDD5', g2: '#FB923C', tc: '#5C1A08', tc2: '#B04020',
  },
  {
    emoji: '🍫', name: 'Chocolate Deluxe', badge: 'Intens', pris: '25 kr', sted: 'Kantina',
    desc: 'Mørk sjokolade møter kremet kondensert melk-is for ultimate nytelse.',
    available: false, g1: '#3D1409', g2: '#0A0200', tc: '#FEF3C7', tc2: '#D4A870',
  },
  {
    emoji: '🍋', name: 'Lemon Dream', badge: 'Syrlig', pris: '25 kr', sted: 'Kantina',
    desc: 'Frisk sitronkrem rørt inn i en silkemyk isbase – syrlig og uimotståelig.',
    available: true, g1: '#FEFCE8', g2: '#FDE047', tc: '#713F12', tc2: '#A16207',
  },
  {
    emoji: '🌴', name: 'Tropical Sunrise', badge: 'Eksotisk', pris: '25 kr', sted: 'Kantina',
    desc: 'En eksplosjon av tropiske frukter – ananas, kokos og lime.',
    available: false, g1: '#FFF7ED', g2: '#F97316', tc: '#7C2D12', tc2: '#C2410C',
  },
  {
    emoji: '🫐', name: 'Forest Berry', badge: 'Vill', pris: '25 kr', sted: 'Kantina',
    desc: 'Blåbær, bringebær og jordbær rørt inn i en kremet isbase.',
    available: true, g1: '#4C1D95', g2: '#1E0938', tc: '#EDE9FE', tc2: '#C4B0F0',
  },
]

export const DEFAULT_TIMES: TimeSlot[] = [
  { day: 'Mandag',  dayNum: 1, time: '11:15 – 12:00', closed: false },
  { day: 'Tirsdag', dayNum: 2, time: '11:15 – 12:00', closed: false },
  { day: 'Onsdag',  dayNum: 3, time: '11:15 – 12:00', closed: false },
  { day: 'Torsdag', dayNum: 4, time: 'Stengt',         closed: true  },
  { day: 'Fredag',  dayNum: 5, time: '11:15 – 12:30', closed: false },
]

export const INCOME_CATEGORIES = [
  'Salg is', 'Salg tilbehør', 'Tilskudd', 'Sponsorinntekt', 'Andre inntekter',
]

export const EXPENSE_CATEGORIES = [
  'Råvarer', 'Emballasje', 'Transport', 'Markedsføring',
  'Utstyr', 'Lisenser/avgifter', 'Andre utgifter',
]

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
    desc: 'Søt og saftig mango fra solrike troper, blandet til perfeksjon.',
    available: true, g1: '#FFEDD5', g2: '#FB923C', tc: '#5C1A08', tc2: '#B04020',
  },
  {
    emoji: '🍫', name: 'Chocolate Deluxe', badge: 'Intens', pris: '25 kr', sted: 'Kantina',
    desc: 'Mørk belgisk sjokolade møter kremete yogurt for ultimate nytelse.',
    available: false, g1: '#3D1409', g2: '#0A0200', tc: '#FEF3C7', tc2: '#D4A870',
  },
  {
    emoji: '🫙', name: 'Greek Yogurt', badge: 'Naturlig', pris: '25 kr', sted: 'Kantina',
    desc: 'Naturlig gresk yogurt – frisk, syrlig og full av protein.',
    available: true, g1: '#F8FAFC', g2: '#CBD5E1', tc: '#1E293B', tc2: '#475569',
  },
  {
    emoji: '🌴', name: 'Tropical Freeze', badge: 'Eksotisk', pris: '25 kr', sted: 'Kantina',
    desc: 'En eksplosjon av tropiske frukter – ananas, kokos og lime.',
    available: false, g1: '#CCFBF1', g2: '#0F9488', tc: '#042F2E', tc2: '#1A7A70',
  },
  {
    emoji: '🫐', name: 'Forest Berry', badge: 'Vill', pris: '25 kr', sted: 'Kantina',
    desc: 'Blåbær, bringebær og jordbær fra norske skoger og enger.',
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
  'Salg yogurt', 'Salg tilbehør', 'Tilskudd', 'Sponsorinntekt', 'Andre inntekter',
]

export const EXPENSE_CATEGORIES = [
  'Råvarer', 'Emballasje', 'Transport', 'Markedsføring',
  'Utstyr', 'Lisenser/avgifter', 'Andre utgifter',
]

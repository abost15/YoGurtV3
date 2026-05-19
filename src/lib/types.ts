export interface Flavor {
  emoji: string
  name: string
  badge: string
  pris: string
  sted: string
  desc: string
  available: boolean
  g1: string
  g2: string
  tc: string
  tc2?: string
  kostnad?: number   // råvarekostnad i kr per porsjon
}

export interface TimeSlot {
  day: string
  dayNum: number
  time: string
  closed: boolean
}

export interface Transaction {
  id: string
  date: string
  description: string
  category: string
  type: 'income' | 'expense'
  amount: number
}

export interface Display {
  name: string
  deviceId: string
  current?: string
  cmd?: { file: string; ts: number }
  status?: { lastSeen: number; current: string }
}

export interface MachineStatus {
  lastSeen: number
  running: boolean
  rpm: number
  stepsPerSec: number
  revolutions: number
  wifiRSSI: number
  current_mA: number
  uptime_s: number
  driverTemp_warning: boolean
  stallGuard: number
  direction: 'left' | 'right'
}

export interface MachineCmd {
  action: 'start' | 'stop' | 'setRPM' | 'setDirection' | 'setCurrent' | 'move'
  rpm?: number
  direction?: 'left' | 'right'
  mA?: number
  revolutions?: number
  ts: number
}

export interface YogurtData {
  flavors: Flavor[]
  times: TimeSlot[]
}

export interface LogEntry {
  ts: number
  msg: string
}

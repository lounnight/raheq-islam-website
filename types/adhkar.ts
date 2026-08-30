export type Dhikr = {
  id: number
  text: string
  count: number
  notes?: string
}

export type DhikrCategory = {
  id: number
  category: string
  array: Dhikr[]
}

export type AdhkarData = DhikrCategory[]

export type Dua = {
  text: string
  reference: string
}

export type DuasData = {
  quran: Dua[]
  sunnah: Dua[]
}

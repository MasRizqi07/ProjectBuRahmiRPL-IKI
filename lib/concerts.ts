import {
  isWithinInterval,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  parseISO,
} from 'date-fns'
import type { Concert, FilterType } from '@/types'

export const concerts: Concert[] = [
  {
    id: 'coldplay-2026',
    title: 'Coldplay Live Jakarta',
    artist: 'Coldplay',
    venue: 'Gelora Bung Karno, Jakarta',
    city: 'Jakarta',
    date: '2026-05-20',
    time: '19:00',
    image: '/images/coldplay.jpg',
    genre: 'Pop Rock',
    description: 'Konser spektakuler Coldplay di Jakarta dengan visual memukau dan setlist terbesar mereka.',
    ticketTiers: [
      { id: 'cat1', name: 'CAT 1', price: 1850000, available: 200, total: 1000, perks: ['Akses VIP', 'Souvenir resmi'] },
      { id: 'cat2', name: 'CAT 2', price: 1200000, available: 500, total: 2000, perks: ['Tempat duduk premium', 'Gratis merchandise'] },
      { id: 'festival', name: 'Festival', price: 750000, available: 300, total: 4000, perks: ['Area berdiri', 'Akses umum'] },
    ],
    status: 'limited',
    isFeatured: true,
    imageGradient: 'from-blue-600 to-purple-600',
    priceMin: 750000,
    priceMax: 5500000,
    ticketsSold: 8500,
    totalTickets: 10000,
  },
  {
    id: 'blackpink-2026',
    title: 'BLACKPINK Live Show',
    artist: 'BLACKPINK',
    venue: 'Istora Senayan, Jakarta',
    city: 'Jakarta',
    date: '2026-06-12',
    time: '20:00',
    image: '/images/blackpink.jpg',
    genre: 'K-Pop',
    description: 'Pertunjukan megah BLACKPINK dengan panggung kelas dunia dan lagu-lagu hits mereka.',
    ticketTiers: [
      { id: 'cat1', name: 'CAT 1', price: 2150000, available: 0, total: 1200, perks: ['Akses panggung depan', 'Merch eksklusif'] },
      { id: 'cat2', name: 'CAT 2', price: 1400000, available: 0, total: 2500, perks: ['Tempat duduk nyaman', 'Program resmi'] },
      { id: 'festival', name: 'Festival', price: 850000, available: 0, total: 4800, perks: ['Akses umum', 'Gratis akses pintu masuk'] },
    ],
    status: 'soldout',
    imageGradient: 'from-pink-600 to-rose-600',
    priceMin: 850000,
    priceMax: 6500000,
    ticketsSold: 12000,
    totalTickets: 12000,
  },
  {
    id: 'dewa-19-2026',
    title: 'Dewa 19 Reunion',
    artist: 'Dewa 19',
    venue: 'Allianz Stadium, Jakarta',
    city: 'Jakarta',
    date: '2026-06-03',
    time: '18:30',
    image: '/images/dewa19.jpg',
    genre: 'Rock',
    description: 'Konser reuni Dewa 19 dengan lagu-lagu klasik yang dikenang oleh generasi Indonesia.',
    ticketTiers: [
      { id: 'cat1', name: 'CAT 1', price: 850000, available: 800, total: 1500, perks: ['Akses panggung', 'Meet & greet virtual'] },
      { id: 'cat2', name: 'CAT 2', price: 550000, available: 1200, total: 2500, perks: ['Tempat duduk nyaman', 'Souvenir resmi'] },
      { id: 'festival', name: 'Festival', price: 350000, available: 2000, total: 4000, perks: ['Area berdiri', 'Spot foto'] },
    ],
    status: 'available',
    imageGradient: 'from-orange-600 to-red-600',
    priceMin: 350000,
    priceMax: 1500000,
    ticketsSold: 3200,
    totalTickets: 8000,
  },
  {
    id: 'pamungkas-2026',
    title: 'Pamungkas Acoustic Night',
    artist: 'Pamungkas',
    venue: 'Mainstage Festival, Bandung',
    city: 'Bandung',
    date: '2026-05-25',
    time: '19:00',
    image: '/images/pamungkas.jpg',
    genre: 'Indie Pop',
    description: 'Malam akustik bersama Pamungkas dalam suasana hangat dan penuh emosi.',
    ticketTiers: [
      { id: 'cat1', name: 'CAT 1', price: 550000, available: 350, total: 800, perks: ['Dekat panggung', 'Foto bersama'] },
      { id: 'cat2', name: 'CAT 2', price: 350000, available: 600, total: 1200, perks: ['Tempat duduk bagus', 'Gratis minuman'] },
      { id: 'festival', name: 'Festival', price: 250000, available: 2000, total: 3000, perks: ['Akses umum', 'Spot selfie'] },
    ],
    status: 'available',
    imageGradient: 'from-cyan-600 to-blue-600',
    priceMin: 250000,
    priceMax: 750000,
    ticketsSold: 1200,
    totalTickets: 5000,
  },
  {
    id: 'rich-brian-2026',
    title: 'Rich Brian Festival',
    artist: 'Rich Brian',
    venue: 'Kota Tua Jakarta, Jakarta',
    city: 'Jakarta',
    date: '2026-05-18',
    time: '20:00',
    image: '/images/richbrian.jpg',
    genre: 'Hip Hop',
    description: 'Penampilan Rich Brian dengan beat kuat dan performa panggung penuh energi.',
    ticketTiers: [
      { id: 'cat1', name: 'CAT 1', price: 1300000, available: 100, total: 800, perks: ['Area dekat panggung', 'Souvenir eksklusif'] },
      { id: 'cat2', name: 'CAT 2', price: 800000, available: 250, total: 1500, perks: ['Tempat duduk lebih baik', 'Akses VIP lounge'] },
      { id: 'festival', name: 'Festival', price: 400000, available: 150, total: 3700, perks: ['Area umum', 'Spot foto'] },
    ],
    status: 'limited',
    imageGradient: 'from-violet-600 to-purple-600',
    priceMin: 400000,
    priceMax: 1800000,
    ticketsSold: 4500,
    totalTickets: 6000,
  },
  {
    id: 'tulus-2026',
    title: 'Tulus Live Jakarta',
    artist: 'Tulus',
    venue: 'Balai Kartini, Jakarta',
    city: 'Jakarta',
    date: '2026-06-22',
    time: '20:30',
    image: '/images/tulus.jpg',
    genre: 'Pop',
    description: 'Konser penuh melodi Tulus dengan orkestra indah dan vokal menawan.',
    ticketTiers: [
      { id: 'cat1', name: 'CAT 1', price: 750000, available: 1000, total: 1500, perks: ['Akses VIP', 'Souvenir resmi'] },
      { id: 'cat2', name: 'CAT 2', price: 500000, available: 1500, total: 2500, perks: ['Tempat duduk nyaman', 'Podcast akses'] },
      { id: 'festival', name: 'Festival', price: 300000, available: 2000, total: 3000, perks: ['Akses umum', 'Spot video'] },
    ],
    status: 'available',
    imageGradient: 'from-emerald-600 to-teal-600',
    priceMin: 300000,
    priceMax: 1200000,
    ticketsSold: 2100,
    totalTickets: 7000,
  },
]

export function filterConcerts(
  concerts: Concert[],
  filter: FilterType,
  cityQuery?: string
): Concert[] {
  const now = new Date()
  const upcoming = concerts.filter((concert) => parseISO(concert.date) >= now)

  switch (filter) {
    case 'all':
      return concerts

    case 'this-week':
      return upcoming.filter((concert) => {
        const concertDate = parseISO(concert.date)
        return isWithinInterval(concertDate, {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
        })
      })

    case 'this-month':
      return upcoming.filter((concert) => {
        const concertDate = parseISO(concert.date)
        return isWithinInterval(concertDate, {
          start: startOfMonth(now),
          end: endOfMonth(now),
        })
      })

    case 'by-city':
      return upcoming.filter((concert) =>
        cityQuery ? concert.city.toLowerCase().includes(cityQuery.toLowerCase().trim()) : true
      )

    case 'available':
      return upcoming.filter((concert) => concert.status !== 'soldout' && concert.status !== 'cancelled')

    case 'featured':
      return upcoming.filter((concert) => concert.isFeatured === true)

    default:
      return concerts
  }
}

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export const getAvailabilityLabel = (status: Concert['status']): string => {
  const labels = {
    available: 'Tersedia',
    limited: 'Terbatas',
    soldout: 'Terjual Habis',
    cancelled: 'Dibatalkan',
  }
  return labels[status]
}

export const getAvailabilityColor = (status: Concert['status']): string => {
  const colors = {
    available: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    limited: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    soldout: 'bg-red-500/20 text-red-300 border-red-500/30',
    cancelled: 'bg-zinc-700/20 text-zinc-400 border-zinc-700/30',
  }
  return colors[status]
}

export const getConcertById = (id: string): Concert | undefined => {
  return concerts.find((concert) => concert.id === id)
}

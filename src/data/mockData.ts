import type { FlightRoute, Hotel, StatItem } from '../types/travel';

export const flightRoutes: FlightRoute[] = [
  {
    title: '1º voo',
    route: 'SBCG — SBRJ · 30/10/2025',
    flights: [
      { carrier: 'Gol Linhas Aéreas', duration: '4h 40min · direto', price: 'R$ 730' },
      { carrier: 'Latam Linhas Aéreas', duration: '4h 40min · direto', price: 'R$ 730' },
      { carrier: 'Azul Linhas Aéreas', duration: '4h 40min · direto', price: 'R$ 730' },
    ],
  },
  {
    title: '2º voo',
    route: 'SBCG — SBSP · 10/12/2025',
    flights: [
      { carrier: 'Gol Linhas Aéreas', duration: '4h 40min · direto', price: 'R$ 730' },
      { carrier: 'Latam Linhas Aéreas', duration: '4h 40min · direto', price: 'R$ 730' },
      { carrier: 'Azul Linhas Aéreas', duration: '4h 40min · direto', price: 'R$ 730' },
    ],
  },
];

export const flightStats: StatItem[] = [
  { value: 'R$ 571', label: 'Tarifa média trimestral — SP' },
  { value: 'R$ 663', label: 'Tarifa média trimestral — RJ' },
  { value: 'R$ 440', label: 'Menor preço registrado (jan)' },
  { value: 'R$ 767', label: 'Maior preço registrado (mar)' },
];

export const hotels: Hotel[] = [
  { name: 'Mercure Hotels', city: 'Rio de Janeiro', price: 'R$ 3.744' },
  { name: 'Ibis', city: 'Rio de Janeiro', price: 'R$ 2.227' },
  { name: 'Novotel', city: 'São Paulo', price: 'R$ 3.518' },
  { name: 'Ibis', city: 'São Paulo', price: 'R$ 2.122' },
];

export const mealStats: StatItem[] = [
  { value: 'R$ 24', label: 'Café da manhã' },
  { value: 'R$ 50', label: 'Almoço' },
  { value: 'R$ 60', label: 'Jantar' },
];

export const typicalFoods = [
  'Feijoada', 'Cachorro-quente', 'Filé mignon grelhado',
  'Cuscuz Paulista', 'Pastel de feira', 'Virado à Paulista',
];

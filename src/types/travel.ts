export interface StatItem {
  value: string;
  label: string;
}

export interface Flight {
  carrier: string;
  duration: string;
  price: string;
}

export interface FlightRoute {
  title: string;
  route: string;
  flights: Flight[];
}

export interface Hotel {
  name: string;
  city: string;
  price: string;
}

export interface SearchFormValues {
  origin: string;
  destination: string;
  dates: string;
  passengers: string;
}

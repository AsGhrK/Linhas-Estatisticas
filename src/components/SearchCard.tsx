import { useState, type FormEvent } from 'react';
import type { SearchFormValues } from '../types/travel';
import './SearchCard.css';

const initialValues: SearchFormValues = { origin: '', destination: '', dates: '', passengers: '1 Adulto' };

export default function SearchCard() {
  const [values, setValues] = useState<SearchFormValues>(initialValues);
  const [submittedSearch, setSubmittedSearch] = useState<SearchFormValues | null>(null);

  function updateField(field: keyof SearchFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setSubmittedSearch(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedSearch({ ...values });
  }

  return (
    <div className="search-card">
      <div className="search-title">BUSCAR PASSAGENS · Origem, destino e datas de ida e volta</div>
      <form className="search-row" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="origin">Origem</label>
          <input id="origin" name="origin" value={values.origin} onChange={(event) => updateField('origin', event.target.value)} placeholder="Campo Grande, SBCG" required />
        </div>
        <div className="field">
          <label htmlFor="destination">Destino</label>
          <input id="destination" name="destination" value={values.destination} onChange={(event) => updateField('destination', event.target.value)} placeholder="Rio de Janeiro, SBRJ" required />
        </div>
        <div className="field">
          <label htmlFor="dates">Datas</label>
          <input id="dates" name="dates" value={values.dates} onChange={(event) => updateField('dates', event.target.value)} placeholder="30/10 — 20/11" required />
        </div>
        <div className="field">
          <label htmlFor="passengers">Passageiros</label>
          <select id="passengers" name="passengers" value={values.passengers} onChange={(event) => updateField('passengers', event.target.value)}>
            <option>1 Adulto</option><option>2 Adultos</option><option>3 Adultos</option><option>4 Adultos</option><option>Família / grupo</option>
          </select>
        </div>
        <button className="btn-primary search-button" type="submit">Buscar</button>
      </form>
      {submittedSearch && (
        <div className="search-feedback" role="status" aria-live="polite">
          <strong>Pesquisa preparada para demonstração.</strong>
          <span>{submittedSearch.origin} → {submittedSearch.destination} · {submittedSearch.dates} · {submittedSearch.passengers}</span>
          <small>Esta versão não consulta tarifas reais. É necessário conectar uma API para obter resultados atualizados.</small>
        </div>
      )}
    </div>
  );
}

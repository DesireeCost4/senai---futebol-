import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { ArrowLeft, Check, Shield, UsersRound } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '../components/RequestState';
import LeagueNavigation from '../components/LeagueNavigation';
import { clubeService } from '../services/clubeService';
import { ligaService } from '../services/ligaService';
import type { Lineup, Player } from '../types/league';
import './EscalacaoPage.css';

type Setor = 'GOL' | 'DEF' | 'MEI' | 'ATA';
type Slot = { key: string; label: string; sector: Setor };
type ClubeElenco = { id: number; name: string; acronym: string; players: Player[] };

const formations = ['3-1', '2-2', '2-1-1', '1-2-1'];

function makeSlots(formation: string): Slot[] {
  const sectors: Record<string, Setor[]> = {
    '3-1': ['DEF', 'DEF', 'DEF', 'ATA'],
    '2-2': ['DEF', 'DEF', 'ATA', 'ATA'],
    '2-1-1': ['DEF', 'DEF', 'MEI', 'ATA'],
    '1-2-1': ['DEF', 'MEI', 'MEI', 'ATA'],
  };
  const sectorNames: Record<Setor, string> = { GOL: 'Goleiro', DEF: 'Defesa', MEI: 'Meio-campo', ATA: 'Ataque' };
  const counts: Partial<Record<Setor, number>> = {};

  return [{ key: 'goleiro', label: 'Goleiro', sector: 'GOL' }, ...(sectors[formation] ?? []).map((sector) => {
    counts[sector] = (counts[sector] ?? 0) + 1;
    return { key: `${sector}-${counts[sector]}`, label: `${sectorNames[sector]} ${counts[sector]}`, sector };
  })];
}

function playerSector(position: string): Setor | null {
  if (position === 'GOL') return 'GOL';
  if (position === 'ZAG' || position === 'LAT') return 'DEF';
  if (position === 'MEI') return 'MEI';
  if (position === 'ATA') return 'ATA';
  return null;
}

function mensagemErro(error: unknown): string {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || error.message || 'Não foi possível atualizar a escalação.';
  }
  if (error instanceof Error) return error.message;
  return 'Não foi possível atualizar a escalação.';
}

function mapExistingPlayers(lineup: Lineup, formation: string): Record<string, string> {
  const selections: Record<string, string> = {};
  const slots = makeSlots(formation);
  const used = new Set<number>();

  for (const slot of slots) {
    const existing = lineup.players.find((player) => !used.has(player.id) && playerSector(player.position) === slot.sector);
    if (existing) {
      selections[slot.key] = String(existing.id);
      used.add(existing.id);
    }
  }

  return selections;
}

export default function EscalacaoPage() {
  const { id } = useParams();
  const clubId = Number(id);
  const [club, setClub] = useState<ClubeElenco | null>(null);
  const [formation, setFormation] = useState('3-1');
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [lineup, setLineup] = useState<Lineup | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const slots = useMemo(() => makeSlots(formation), [formation]);
  const availablePlayers = useMemo(() => (club?.players ?? []).filter((player) => player.condition !== 'DOENTE'), [club]);
  const selectedIds = useMemo(() => Object.values(selections).filter(Boolean), [selections]);
  const isCompleteSelection = slots.every((slot) => Boolean(selections[slot.key])) && new Set(selectedIds).size === 5;

  useEffect(() => {
    if (!Number.isInteger(clubId) || clubId <= 0) {
      setError('Identificador de clube inválido.');
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    async function loadLineup() {
      setLoading(true);
      setError('');
      try {
        const [clubResponse, lineupResponse] = await Promise.all([
          clubeService.buscarClubePorId(clubId) as Promise<ClubeElenco>,
          ligaService.buscarEscalacao(clubId),
        ]);
        if (cancelled) return;
        setClub(clubResponse);
        setLineup(lineupResponse);
        const nextFormation = formations.includes(lineupResponse.formation ?? '') ? lineupResponse.formation! : '3-1';
        setFormation(nextFormation);
        setSelections(mapExistingPlayers(lineupResponse, nextFormation));
      } catch (requestError) {
        if (!cancelled) setError(mensagemErro(requestError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadLineup();
    return () => {
      cancelled = true;
    };
  }, [clubId, reloadKey]);

  function changeFormation(nextFormation: string) {
    setFormation(nextFormation);
    setSelections({});
    setSuccess('');
  }

  async function saveLineup() {
    if (saving || !isCompleteSelection || !clubId) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updated = await ligaService.salvarEscalacao(clubId, formation, selectedIds.map(Number));
      setLineup(updated);
      setSelections(mapExistingPlayers(updated, formation));
      setSuccess('Escalação salva com sucesso.');
    } catch (requestError) {
      setError(mensagemErro(requestError));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="lineup-page"><LoadingState message="Carregando elenco e escalação..." /></main>;
  if (error && !club) return <main className="lineup-page"><ErrorState message={error} onRetry={() => setReloadKey((current) => current + 1)} /></main>;

  return (
    <main className="lineup-page">
      <Link className="lineup-back" to={`/clubs/${clubId}`}><ArrowLeft size={15} />Voltar para {club?.name ?? 'clube'}</Link>
      <LeagueNavigation clubId={clubId} active="lineup" />
      <header className="lineup-header">
        <span className="lineup-header__icon"><Shield size={20} /></span>
        <div>
          <div className="lineup-header__eyebrow">{club?.acronym} · Liga</div>
          <h1>Escalação</h1>
          <p>Escolha uma formação e os cinco titulares do clube.</p>
        </div>
      </header>

      <section className="lineup-panel" aria-labelledby="lineup-formation-title">
        <header className="lineup-panel__header">
          <div>
            <h2 id="lineup-formation-title">Formação</h2>
            <p>1 goleiro e 4 jogadores de linha conforme os setores.</p>
          </div>
          <div className="formation-options" role="group" aria-label="Formação">
            {formations.map((option) => (
              <button type="button" key={option} aria-pressed={formation === option} className={formation === option ? 'formation-option formation-option--active' : 'formation-option'} onClick={() => changeFormation(option)} disabled={saving}>{option}</button>
            ))}
          </div>
        </header>

        {error && <div className="lineup-error" role="alert">{error}</div>}
        {success && <div className="lineup-success" role="status"><Check size={15} />{success}</div>}
        {availablePlayers.length === 0 ? (
          <EmptyState message="Este clube não possui jogadores aptos para escalar." />
        ) : (
          <div className="lineup-slots">
            {slots.map((slot) => {
              const candidates = availablePlayers.filter((player) => playerSector(player.position) === slot.sector && (!selectedIds.includes(String(player.id)) || selections[slot.key] === String(player.id)));
              return (
                <label className="lineup-slot" key={slot.key}>
                  <span>{slot.label} <b>*</b></span>
                  <select value={selections[slot.key] ?? ''} onChange={(event) => setSelections((current) => ({ ...current, [slot.key]: event.target.value }))} disabled={saving}>
                    <option value="">Selecione um jogador</option>
                    {candidates.map((player) => <option key={player.id} value={player.id}>{player.name} · {player.position} · G{player.overall ?? '—'}</option>)}
                  </select>
                </label>
              );
            })}
          </div>
        )}

        <footer className="lineup-panel__footer">
          <div className={lineup?.complete && isCompleteSelection ? 'lineup-status lineup-status--complete' : 'lineup-status'}>
            <span className="lineup-status__dot" />
            {lineup?.complete && isCompleteSelection ? 'Clube pode jogar' : 'Escalação incompleta: clube não pode jogar'}
          </div>
          <button className="lineup-save-button" type="button" onClick={() => void saveLineup()} disabled={saving || !isCompleteSelection || availablePlayers.length < 5}>
            {saving ? 'Salvando...' : 'Salvar escalação'}
          </button>
        </footer>
      </section>

      <section className="lineup-roster" aria-label="Elenco disponível">
        <h2><UsersRound size={16} />Elenco disponível <span>{availablePlayers.length}</span></h2>
        <div>
          {club?.players.map((player) => (
            <span className={player.condition === 'DOENTE' ? 'roster-chip roster-chip--sick' : 'roster-chip'} key={player.id}>
              {player.name}<small>{player.position}{player.condition === 'DOENTE' ? ' · Doente' : ''}</small>
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
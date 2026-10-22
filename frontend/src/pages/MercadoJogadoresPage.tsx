import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Handshake,
  HeartPulse,
  MoreHorizontal,
  Plus,
  Pencil,
  RotateCcw,
  Search,
  SearchX,
  ShoppingCart,
  Trash2,
  UsersRound,
  X,
} from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '../components/RequestState';
import AlterarCondicaoDialog from '../components/AlterarCondicaoDialog';
import DetalhesJogadorDialog from '../components/DetalhesJogadorDialog';
import { clubeService } from '../services/clubeService';
import { jogadorService } from '../services/jogadorService';
import { mercadoService } from '../services/mercadoService';
import {
  brasiliaDateTimeInputToIso,
  formatCurrency,
  formatDateTimeLocalBrasilia,
} from '../utils/formatters';
import type { CompraResultado } from '../types/transactions';
import type {
  CondicaoJogador,
  EdicaoJogador,
  FiltrosJogadores,
  Jogador,
  NovoJogador,
  OrdenacaoJogadores,
} from '../types/players';
import './MercadoJogadoresPage.css';
import TransactionResultDialog from '../components/TransactionResultDialog';

type ClubeOption = {
  id: number;
  name: string;
  acronym: string;
  cash?: number | string;
};

type AbaElenco = 'todos' | 'livres' | 'clubes';

const positions = [
  { value: 'GOL', label: 'Goleiro' },
  { value: 'ZAG', label: 'Zagueiro' },
  { value: 'LAT', label: 'Lateral' },
  { value: 'MEI', label: 'Meio-campo' },
  { value: 'ATA', label: 'Atacante' },
];

const sortOptions: { value: OrdenacaoJogadores; label: string }[] = [
  { value: 'name', label: 'Nome' },
  { value: 'value_desc', label: 'Maior valor' },
  { value: 'value_asc', label: 'Menor valor' },
  { value: 'age_asc', label: 'Menor idade' },
  { value: 'age_desc', label: 'Maior idade' },
  { value: 'position', label: 'Posição' },
];

type CondicaoOption = {
  value: CondicaoJogador;
  label: string;
  description: string[];
};

const conditionOptions: CondicaoOption[] = [
  {
    value: 'APTO',
    label: 'Apto',
    description: [
      'Sem desconto por condição física.',
      'O ajuste pela idade continua valendo na conta.',
    ],
  },
  {
    value: 'MAL_CONDICIONADO',
    label: 'Mal condicionado',
    description: [
      'Desconto de 15%. Agilidade de 80 a 100: metade do desconto; de 1 a 30: +10 pontos.',
      'Máximo de 25% de desconto.',
    ],
  },
  {
    value: 'DOENTE',
    label: 'Doente',
    description: ['Desconto de 30%. Agilidade de 80 a 100: metade; de 1 a 30: +10 pontos.'],
  },
];

const emptyPlayerForm: NovoJogador = {
  name: '',
  position: '',
  age: 0,
  agility: 0,
  pace: 0,
  shooting: 0,
  passing: 0,
  dribbling: 0,
  defending: 0,
  physical: 0,
  potential: 0,
};

type TechnicalAttributeKey =
  'pace' | 'shooting' | 'passing' | 'dribbling' | 'defending' | 'physical';

const technicalAttributes: { key: TechnicalAttributeKey; label: string }[] = [
  { key: 'pace', label: 'Velocidade' },
  { key: 'shooting', label: 'Finalização' },
  { key: 'passing', label: 'Passe' },
  { key: 'dribbling', label: 'Drible' },
  { key: 'defending', label: 'Defesa' },
  { key: 'physical', label: 'Físico' },
];

type ErrosCadastro = Partial<Record<keyof NovoJogador, string>>;
type ErrosEdicao = Partial<Record<keyof EdicaoJogador, string>>;

function validarEdicao(dados: EdicaoJogador, jogadorOriginal: Jogador): ErrosEdicao {
  const errors: ErrosEdicao = {};
  const name = dados.name.trim();

  if (name.length < 3 || name.length > 100 || name.split(/\s+/).length < 2 || /\d/.test(name)) {
    errors.name = 'Use de 3 a 100 caracteres, pelo menos duas palavras e sem números.';
  }
  if (!positions.some(({ value }) => value === dados.position)) {
    errors.position = 'Selecione uma posição.';
  } else if (
    jogadorOriginal.club_id !== null &&
    jogadorOriginal.club_id !== undefined &&
    dados.position !== jogadorOriginal.position
  ) {
    errors.position = 'Jogadores que pertencem a um clube não podem mudar de posição.';
  }
  if (!Number.isInteger(dados.age) || dados.age < 16 || dados.age > 45) {
    errors.age = 'A idade deve estar entre 16 e 45 anos.';
  } else if (dados.age < jogadorOriginal.age) {
    errors.age = 'A idade não pode ser menor que a idade atual.';
  }
  if (!Number.isInteger(dados.agility) || dados.agility < 1 || dados.agility > 100) {
    errors.agility = 'A agilidade deve estar entre 1 e 100.';
  } else if (dados.age >= 35 && dados.agility > 85) {
    errors.agility = 'A partir dos 35 anos, a agilidade máxima é 85.';
  }

  return errors;
}

function validarCadastro(dados: NovoJogador): ErrosCadastro {
  const errors: ErrosCadastro = {};
  const name = dados.name.trim();
  const attributes = technicalAttributes.map(({ key }) => Number(dados[key]));
  const highestAttribute = Math.max(...attributes);
  const attributeSum = attributes.reduce((sum, value) => sum + value, 0);

  if (name.length < 3 || name.length > 100 || name.split(/\s+/).length < 2 || /\d/.test(name)) {
    errors.name = 'Use de 3 a 100 caracteres, pelo menos duas palavras e sem números.';
  }
  if (!positions.some(({ value }) => value === dados.position)) {
    errors.position = 'Selecione uma posição.';
  }
  if (!Number.isInteger(dados.age) || dados.age < 16 || dados.age > 45) {
    errors.age = 'A idade deve estar entre 16 e 45 anos.';
  }
  if (!Number.isInteger(dados.agility) || dados.agility < 1 || dados.agility > 100) {
    errors.agility = 'A agilidade deve estar entre 1 e 100.';
  } else if (dados.age >= 35 && dados.agility > 85) {
    errors.agility = 'A partir dos 35 anos, a agilidade máxima é 85.';
  }
  for (const { key, label } of technicalAttributes) {
    const value = dados[key];
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 99) {
      errors[key] = `${label}: informe um valor entre 1 e 99.`;
    }
  }
  if (attributeSum > 480) {
    errors.physical = 'A soma dos seis atributos técnicos não pode passar de 480.';
  }
  if (!Number.isInteger(dados.potential) || dados.potential < 1 || dados.potential > 99) {
    errors.potential = 'O potencial deve estar entre 1 e 99.';
  } else if (dados.age >= 33 && dados.potential !== highestAttribute) {
    errors.potential = `Para jogadores com 33 anos ou mais, o potencial deve ser ${highestAttribute}.`;
  } else if (dados.potential < highestAttribute) {
    errors.potential = 'O potencial não pode ser menor que o maior atributo técnico.';
  }

  return errors;
}

function mensagemErro(error: unknown, fallback: string): string {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

function buildFilters(
  search: string,
  position: string,
  condition: string,
  clubId: string,
  minAge: string,
  maxAge: string,
  minValue: string,
  maxValue: string,
): Omit<FiltrosJogadores, 'page' | 'limit' | 'free'> {
  const filters: Omit<FiltrosJogadores, 'page' | 'limit' | 'free'> = {
    search: search.trim() || undefined,
    position: position || undefined,
    condition: condition || undefined,
    clubId: clubId ? Number(clubId) : undefined,
    minAge: minAge === '' ? undefined : Number(minAge),
    maxAge: maxAge === '' ? undefined : Number(maxAge),
    minValue: minValue === '' ? undefined : Number(minValue),
    maxValue: maxValue === '' ? undefined : Number(maxValue),
  };

  return filters;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase();
}

function positionName(position: string): string {
  return positions.find((item) => item.value === position)?.label ?? position;
}

function formatAmount(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function conditionLabel(condition: string): string {
  if (condition === 'APTO') return 'Apto';
  if (condition === 'DOENTE') return 'Doente';
  return 'Mal condicionado';
}

function normalizeCondition(condition: string | undefined): CondicaoJogador {
  if (condition === 'DOENTE') return 'DOENTE';
  if (condition === 'MAL_CONDICIONADO') return 'MAL_CONDICIONADO';
  return 'APTO';
}

function pageButtons(page: number, pageCount: number): number[] {
  const first = Math.max(1, Math.min(page - 1, pageCount - 2));
  return Array.from({ length: Math.min(pageCount, 3) }, (_, index) => first + index);
}

export default function MercadoJogadoresPage() {
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [clubes, setClubes] = useState<ClubeOption[]>([]);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [contagens, setContagens] = useState({ todos: 0, livres: 0, clubes: 0 });
  const [busca, setBusca] = useState('');
  const [posicao, setPosicao] = useState('');
  const [condicao, setCondicao] = useState('');
  const [clubeFiltro, setClubeFiltro] = useState('');
  const [idadeMinima, setIdadeMinima] = useState('');
  const [idadeMaxima, setIdadeMaxima] = useState('');
  const [valorMinimo, setValorMinimo] = useState('');
  const [valorMaximo, setValorMaximo] = useState('');
  const [aba, setAba] = useState<AbaElenco>('todos');
  const [ordenacao, setOrdenacao] = useState<OrdenacaoJogadores>('name');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [erroClubes, setErroClubes] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [jogadorCompra, setJogadorCompra] = useState<Jogador | null>(null);
  const [clubeId, setClubeId] = useState('');
  const [fidelidadeAte, setFidelidadeAte] = useState(() =>
    formatDateTimeLocalBrasilia(new Date(Date.now() + 24 * 60 * 60 * 1000)),
  );
  const [errosCampos, setErrosCampos] = useState<{ clubId?: string; loyaltyUntil?: string }>({});
  const [erroCompra, setErroCompra] = useState('');
  const [comprando, setComprando] = useState(false);
  const [resultado, setResultado] = useState<CompraResultado | null>(null);
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [formJogador, setFormJogador] = useState<NovoJogador>(emptyPlayerForm);
  const [erroCadastro, setErroCadastro] = useState('');
  const [cadastrando, setCadastrando] = useState(false);
  const [cadastroTentado, setCadastroTentado] = useState(false);
  const [cadastroSucesso, setCadastroSucesso] = useState('');
  const [cadastroResultado, setCadastroResultado] = useState<Jogador | null>(null);
  const [mostrarDetalhesCadastro, setMostrarDetalhesCadastro] = useState(false);
  const [menuAcoesJogadorId, setMenuAcoesJogadorId] = useState<number | null>(null);
  const [menuAcoesPosition, setMenuAcoesPosition] = useState<{ top: number; left: number } | null>(
    null,
  );
  const [jogadorDetalhes, setJogadorDetalhes] = useState<Jogador | null>(null);
  const [jogadorEdicao, setJogadorEdicao] = useState<Jogador | null>(null);
  const [formEdicao, setFormEdicao] = useState<EdicaoJogador | null>(null);
  const [edicaoTentada, setEdicaoTentada] = useState(false);
  const [erroEdicao, setErroEdicao] = useState('');
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [jogadorExclusao, setJogadorExclusao] = useState<Jogador | null>(null);
  const [erroExclusao, setErroExclusao] = useState('');
  const [excluindoJogador, setExcluindoJogador] = useState(false);
  const [jogadorCondicao, setJogadorCondicao] = useState<Jogador | null>(null);
  const [condicaoSelecionada, setCondicaoSelecionada] = useState<CondicaoJogador>('APTO');
  const [erroCondicao, setErroCondicao] = useState('');
  const [salvandoCondicao, setSalvandoCondicao] = useState(false);
  const [showAlterarCondicaoDialog, setShowAlterarCondicaoDialog] = useState(false);
  const [condicaoTemporaria, setCondicaoTemporaria] = useState<CondicaoJogador>('APTO');
  const compraEmCurso = useRef(false);
  const cadastroEmCurso = useRef(false);
  const edicaoEmCurso = useRef(false);
  const exclusaoEmCurso = useRef(false);
  const condicaoEmCurso = useRef(false);
  const errosCadastro = useMemo(() => validarCadastro(formJogador), [formJogador]);
  const errosEdicaoForm = useMemo(
    () => (formEdicao && jogadorEdicao ? validarEdicao(formEdicao, jogadorEdicao) : {}),
    [formEdicao, jogadorEdicao],
  );
  const playerFilters = useMemo(
    () =>
      buildFilters(
        busca,
        posicao,
        condicao,
        clubeFiltro,
        idadeMinima,
        idadeMaxima,
        valorMinimo,
        valorMaximo,
      ),
    [busca, posicao, condicao, clubeFiltro, idadeMinima, idadeMaxima, valorMinimo, valorMaximo],
  );
  const ageRangeError = (() => {
    const min = idadeMinima === '' ? null : Number(idadeMinima);
    const max = idadeMaxima === '' ? null : Number(idadeMaxima);
    if (
      (min !== null && (!Number.isInteger(min) || min < 16 || min > 45)) ||
      (max !== null && (!Number.isInteger(max) || max < 16 || max > 45))
    ) {
      return 'A idade deve estar entre 16 e 45 anos.';
    }
    if (min !== null && max !== null && min > max) {
      return 'A idade mínima não pode ser maior que a máxima.';
    }
    return '';
  })();
  const valueRangeError = (() => {
    const min = valorMinimo === '' ? null : Number(valorMinimo);
    const max = valorMaximo === '' ? null : Number(valorMaximo);
    if (
      (min !== null && (!Number.isFinite(min) || min < 0)) ||
      (max !== null && (!Number.isFinite(max) || max < 0))
    ) {
      return 'Os valores devem ser iguais ou maiores que zero.';
    }
    if (min !== null && max !== null && min > max) {
      return 'O valor mínimo não pode ser maior que o máximo.';
    }
    return '';
  })();
  const filterError = ageRangeError || valueRangeError;
  const activeFilters = [
    ...(busca.trim() ? [{ key: 'search', label: `Busca: ${busca.trim()}` }] : []),
    ...(posicao ? [{ key: 'position', label: `Posição: ${positionName(posicao)}` }] : []),
    ...(condicao ? [{ key: 'condition', label: `Condição: ${conditionLabel(condicao)}` }] : []),
    ...(clubeFiltro
      ? [
          {
            key: 'club',
            label: `Clube: ${clubes.find((club) => String(club.id) === clubeFiltro)?.name ?? clubeFiltro}`,
          },
        ]
      : []),
    ...(idadeMinima || idadeMaxima
      ? [
          {
            key: 'age',
            label: `Idade: ${idadeMinima || '—'} a ${idadeMaxima || '—'}`,
          },
        ]
      : []),
    ...(valorMinimo || valorMaximo
      ? [
          {
            key: 'value',
            label: `Valor de mercado: ${valorMinimo ? formatAmount(valorMinimo) : '—'} a ${valorMaximo ? formatAmount(valorMaximo) : '—'}`,
          },
        ]
      : []),
  ];

  useEffect(() => {
    if (menuAcoesJogadorId === null) return;

    function fecharMenu(event: MouseEvent | KeyboardEvent) {
      if (event instanceof KeyboardEvent && event.key === 'Escape') {
        setMenuAcoesJogadorId(null);
        setMenuAcoesPosition(null);
      } else if (
        event instanceof MouseEvent &&
        event.target instanceof Element &&
        !event.target.closest('.market-row-actions, .market-player-actions-menu')
      ) {
        setMenuAcoesJogadorId(null);
        setMenuAcoesPosition(null);
      }
    }

    document.addEventListener('mousedown', fecharMenu);
    document.addEventListener('keydown', fecharMenu);
    return () => {
      document.removeEventListener('mousedown', fecharMenu);
      document.removeEventListener('keydown', fecharMenu);
    };
  }, [menuAcoesJogadorId]);

  useEffect(() => {
    let cancelled = false;
    async function carregarClubes() {
      setErroClubes('');
      try {
        const lista = (await clubeService.listarClubes('name')) as ClubeOption[];
        if (!cancelled) setClubes(lista);
      } catch (requestError) {
        if (!cancelled)
          setErroClubes(mensagemErro(requestError, 'Não foi possível carregar os clubes.'));
      }
    }
    void carregarClubes();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function carregarJogadores() {
      if (filterError) {
        setJogadores([]);
        setTotal(0);
        setTotalPaginas(0);
        setCarregando(false);
        return;
      }

      setCarregando(true);
      setErro('');
      const activeTab = aba === 'livres' ? true : aba === 'clubes' ? false : undefined;
      const { clubId: selectedClubFilter, ...countFilters } = playerFilters;
      try {
        const [pageResponse, allCount, freeCount, clubCount] = await Promise.all([
          jogadorService.listarJogadores({
            ...playerFilters,
            free: activeTab,
            sort: ordenacao,
            page: pagina,
            limit: 10,
          }),
          jogadorService.listarJogadores({ ...playerFilters, page: 1, limit: 1 }),
          selectedClubFilter
            ? Promise.resolve(null)
            : jogadorService.listarJogadores({
                ...countFilters,
                free: true,
                page: 1,
                limit: 1,
              }),
          jogadorService.listarJogadores({
            ...playerFilters,
            free: false,
            page: 1,
            limit: 1,
          }),
        ]);
        if (cancelled) return;
        setJogadores(pageResponse.data);
        setTotal(pageResponse.meta.total_items);
        setTotalPaginas(pageResponse.meta.total_pages);
        setContagens({
          todos: allCount.meta.total_items,
          livres: freeCount?.meta.total_items ?? 0,
          clubes: clubCount.meta.total_items,
        });
      } catch (requestError) {
        if (!cancelled)
          setErro(mensagemErro(requestError, 'Não foi possível carregar os jogadores.'));
      } finally {
        if (!cancelled) setCarregando(false);
      }
    }
    void carregarJogadores();
    return () => {
      cancelled = true;
    };
  }, [aba, filterError, pagina, playerFilters, ordenacao, reloadKey]);

  function resetarPagina() {
    setPagina(1);
  }

  function limparFiltros() {
    setBusca('');
    setPosicao('');
    setCondicao('');
    setClubeFiltro('');
    setIdadeMinima('');
    setIdadeMaxima('');
    setValorMinimo('');
    setValorMaximo('');
    setAba('todos');
    resetarPagina();
  }

  function removerFiltro(key: string) {
    if (key === 'search') setBusca('');
    if (key === 'position') setPosicao('');
    if (key === 'condition') setCondicao('');
    if (key === 'club') {
      setClubeFiltro('');
      if (aba === 'clubes') setAba('todos');
    }
    if (key === 'age') {
      setIdadeMinima('');
      setIdadeMaxima('');
    }
    if (key === 'value') {
      setValorMinimo('');
      setValorMaximo('');
    }
    resetarPagina();
  }

  function validarCompra(): boolean {
    const errors: { clubId?: string; loyaltyUntil?: string } = {};
    if (!clubeId) errors.clubId = 'Selecione o clube comprador.';
    if (!fidelidadeAte) errors.loyaltyUntil = 'Informe o fim da fidelidade.';
    else if (!brasiliaDateTimeInputToIso(fidelidadeAte))
      errors.loyaltyUntil = 'Informe uma data e hora válidas.';
    setErrosCampos(errors);
    return Object.keys(errors).length === 0;
  }

  async function confirmarCompra(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (compraEmCurso.current || !jogadorCompra || !validarCompra()) return;
    const loyaltyUntil = brasiliaDateTimeInputToIso(fidelidadeAte);
    if (!loyaltyUntil) return;

    compraEmCurso.current = true;
    setComprando(true);
    setErroCompra('');
    try {
      const resposta = (await mercadoService.comprarJogador(jogadorCompra.id, {
        clubId: Number(clubeId),
        loyaltyUntil,
      })) as CompraResultado;
      setResultado(resposta);
      setJogadorCompra(null);
      setClubeFiltro(clubeId);
      setAba('clubes');
      setPagina(1);
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      setErroCompra(mensagemErro(requestError, 'Não foi possível concluir a compra.'));
    } finally {
      compraEmCurso.current = false;
      setComprando(false);
    }
  }

  function abrirCompra(jogador: Jogador) {
    setJogadorCompra(jogador);
    setClubeId('');
    setFidelidadeAte(formatDateTimeLocalBrasilia(new Date(Date.now() + 24 * 60 * 60 * 1000)));
    setErrosCampos({});
    setErroCompra('');
  }

  async function cadastrarJogador(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCadastroTentado(true);
    if (Object.keys(errosCadastro).length > 0) return;
    if (cadastroEmCurso.current) return;
    cadastroEmCurso.current = true;
    setCadastrando(true);
    setErroCadastro('');
    try {
      const jogadorCadastrado = await jogadorService.cadastrarJogador({
        ...formJogador,
        name: formJogador.name.trim(),
      });
      setFormularioAberto(false);
      setFormJogador(emptyPlayerForm);
      setCadastroTentado(false);
      setCadastroSucesso('Jogador cadastrado com sucesso.');
      setCadastroResultado(jogadorCadastrado);
      setMostrarDetalhesCadastro(false);
      setAba('todos');
      setPagina(1);
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      setErroCadastro(mensagemErro(requestError, 'Não foi possível cadastrar o jogador.'));
    } finally {
      cadastroEmCurso.current = false;
      setCadastrando(false);
    }
  }

  function abrirEdicao(jogador: Jogador) {
    setMenuAcoesJogadorId(null);
    setMenuAcoesPosition(null);
    setJogadorEdicao(jogador);
    setFormEdicao({
      name: jogador.name,
      position: jogador.position,
      age: jogador.age,
      agility: jogador.agility,
    });
    setEdicaoTentada(false);
    setErroEdicao('');
  }

  async function salvarEdicao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEdicaoTentada(true);
    if (!jogadorEdicao || !formEdicao || Object.keys(errosEdicaoForm).length > 0) return;
    if (edicaoEmCurso.current) return;

    edicaoEmCurso.current = true;
    setSalvandoEdicao(true);
    setErroEdicao('');
    try {
      await jogadorService.editarJogador(jogadorEdicao.id, {
        ...formEdicao,
        name: formEdicao.name.trim(),
      });
      setJogadorEdicao(null);
      setFormEdicao(null);
      setCadastroSucesso('Jogador atualizado com sucesso.');
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      setErroEdicao(mensagemErro(requestError, 'Não foi possível atualizar o jogador.'));
    } finally {
      edicaoEmCurso.current = false;
      setSalvandoEdicao(false);
    }
  }

  function confirmarExclusao(jogador: Jogador) {
    setMenuAcoesJogadorId(null);
    setMenuAcoesPosition(null);
    setErroExclusao('');
    setJogadorExclusao(jogador);
  }

  async function excluirJogador() {
    if (!jogadorExclusao || exclusaoEmCurso.current) return;
    exclusaoEmCurso.current = true;
    setExcluindoJogador(true);
    setErroExclusao('');
    try {
      await jogadorService.excluirJogador(jogadorExclusao.id);
      setJogadorExclusao(null);
      setCadastroSucesso('Jogador excluído com sucesso.');
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      setErroExclusao(mensagemErro(requestError, 'Não foi possível excluir o jogador.'));
    } finally {
      exclusaoEmCurso.current = false;
      setExcluindoJogador(false);
    }
  }

  function abrirCondicao(jogador: Jogador) {
    setMenuAcoesJogadorId(null);
    setMenuAcoesPosition(null);
    const condicaoAtual = normalizeCondition(jogador.condition);
    setJogadorCondicao(jogador);
    setCondicaoTemporaria(condicaoAtual);
    setShowAlterarCondicaoDialog(true);
    setErroCondicao('');
  }

  async function salvarCondicao(newCondition: CondicaoJogador) {
    if (!jogadorCondicao || condicaoEmCurso.current) return;
    condicaoEmCurso.current = true;
    setSalvandoCondicao(true);
    setErroCondicao('');
    try {
      await jogadorService.alterarCondicao(jogadorCondicao.id, newCondition);
      setJogadorCondicao(null);
      setShowAlterarCondicaoDialog(false);
      setCadastroSucesso(
        `Condição de ${jogadorCondicao.name} alterada para ${conditionLabel(newCondition)}.`,
      );
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      setErroCondicao(mensagemErro(requestError, 'Não foi possível alterar a condição do jogador.'));
    } finally {
      condicaoEmCurso.current = false;
      setSalvandoCondicao(false);
    }
  }

  const firstVisible = total === 0 ? 0 : (pagina - 1) * 10 + 1;
  const lastVisible = Math.min(pagina * 10, total);

  return (
    <main className="market-players-page">
      <header className="market-players-header">
        <span className="market-players-header__icon">
          <UsersRound size={19} />
        </span>
        <div className="market-players-header__copy">
          <h1>Jogadores</h1>
          <p>Cadastre jogadores, acompanhe os indicadores e compare os que estão livres.</p>
        </div>
        <div className="market-players-header__actions">
          <button
            className="market-refresh-button"
            type="button"
            onClick={() => setReloadKey((current) => current + 1)}
            disabled={carregando}
            aria-label="Atualizar jogadores"
            title="Atualizar lista"
          >
            <RotateCcw size={14} />
          </button>
          <button
            className="market-create-button"
            type="button"
            onClick={() => {
              setCadastroSucesso('');
              setErroCadastro('');
              setCadastroResultado(null);
              setMostrarDetalhesCadastro(false);
              setFormJogador(emptyPlayerForm);
              setCadastroTentado(false);
              setFormularioAberto(true);
            }}
          >
            <Plus size={14} />
            Novo jogador
          </button>
        </div>
      </header>

      {cadastroSucesso && (
        <p className="market-success-message" role="status">
          {cadastroSucesso}
        </p>
      )}
      {erroClubes && (
        <p className="market-inline-error" role="alert">
          {erroClubes}
        </p>
      )}

      <section className="market-players-panel" aria-label="Lista de jogadores">
        <div className="market-filter-bar">
          <label className="market-players-search">
            <Search size={14} aria-hidden="true" />
            <span className="sr-only">Buscar por nome</span>
            <input
              value={busca}
              onChange={(event) => {
                setBusca(event.target.value);
                resetarPagina();
              }}
              placeholder="Buscar por nome"
            />
            {busca && (
              <button type="button" onClick={() => setBusca('')} aria-label="Limpar busca">
                <X size={13} />
              </button>
            )}
          </label>
          <label className="market-filter">
            <span className="sr-only">Posição</span>
            <select
              value={posicao}
              onChange={(event) => {
                setPosicao(event.target.value);
                resetarPagina();
              }}
            >
              <option value="">Posição</option>
              {positions.map((position) => (
                <option key={position.value} value={position.value}>
                  {position.label}
                </option>
              ))}
            </select>
            <ChevronDown size={12} aria-hidden="true" />
          </label>
          <label className="market-filter">
            <span className="sr-only">Condição</span>
            <select
              value={condicao}
              onChange={(event) => {
                setCondicao(event.target.value);
                resetarPagina();
              }}
            >
              <option value="">Condição</option>
              <option value="APTO">Apto</option>
              <option value="MAL_CONDICIONADO">Mal condicionado</option>
              <option value="DOENTE">Doente</option>
            </select>
            <ChevronDown size={12} aria-hidden="true" />
          </label>
          <label
            className={`market-filter market-filter--club${aba === 'livres' ? ' market-filter--disabled' : ''}`}
            title={
              aba === 'livres' ? 'A aba “Livres” não combina com filtro por clube.' : undefined
            }
          >
            <span className="sr-only">Clube</span>
            <select
              value={clubeFiltro}
              disabled={aba === 'livres'}
              aria-describedby={aba === 'livres' ? 'free-club-filter-hint' : undefined}
              onChange={(event) => {
                setClubeFiltro(event.target.value);
                if (event.target.value) setAba('clubes');
                else if (aba === 'clubes') setAba('todos');
                resetarPagina();
              }}
            >
              <option value="">Clube</option>
              {clubes.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
            <ChevronDown size={12} aria-hidden="true" />
            {aba === 'livres' && (
              <span id="free-club-filter-hint" className="sr-only">
                O filtro de clube não está disponível na aba Livres.
              </span>
            )}
          </label>
          <fieldset className="market-range-filter">
            <legend>Idade</legend>
            <label>
              <span className="sr-only">Idade mínima</span>
              <input
                type="number"
                min={16}
                max={45}
                value={idadeMinima}
                placeholder="Mín."
                aria-label="Idade mínima"
                aria-invalid={Boolean(ageRangeError)}
                onChange={(event) => {
                  setIdadeMinima(event.target.value);
                  resetarPagina();
                }}
              />
            </label>
            <span className="market-range-filter__separator">a</span>
            <label>
              <span className="sr-only">Idade máxima</span>
              <input
                type="number"
                min={16}
                max={45}
                value={idadeMaxima}
                placeholder="Máx."
                aria-label="Idade máxima"
                aria-invalid={Boolean(ageRangeError)}
                onChange={(event) => {
                  setIdadeMaxima(event.target.value);
                  resetarPagina();
                }}
              />
            </label>
          </fieldset>
          <fieldset className="market-range-filter market-range-filter--value">
            <legend>Valor de mercado</legend>
            <label>
              <span className="sr-only">Valor mínimo</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={valorMinimo}
                placeholder="Mín."
                aria-label="Valor mínimo"
                aria-invalid={Boolean(valueRangeError)}
                onChange={(event) => {
                  setValorMinimo(event.target.value);
                  resetarPagina();
                }}
              />
            </label>
            <span className="market-range-filter__separator">a</span>
            <label>
              <span className="sr-only">Valor máximo</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={valorMaximo}
                placeholder="Máx."
                aria-label="Valor máximo"
                aria-invalid={Boolean(valueRangeError)}
                onChange={(event) => {
                  setValorMaximo(event.target.value);
                  resetarPagina();
                }}
              />
            </label>
          </fieldset>
        </div>

        {activeFilters.length > 0 && (
          <div className="market-active-filters" aria-label="Filtros ativos">
            <span>
              {busca.trim() && activeFilters.length === 1
                ? 'Resultados para a busca:'
                : 'Filtros ativos:'}
            </span>
            <div className="market-active-filters__list">
              {activeFilters.map(({ key, label }) => (
                <span className="market-filter-chip" key={key}>
                  {label}
                  <button
                    type="button"
                    aria-label={`Remover filtro ${label}`}
                    onClick={() => removerFiltro(key)}
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            <button className="market-clear-filters" type="button" onClick={limparFiltros}>
              Limpar filtros
            </button>
          </div>
        )}
        {filterError && (
          <p className="market-filter-error" role="alert">
            {filterError}
          </p>
        )}

        <div className="market-list-toolbar">
          <div className="market-player-tabs" role="tablist" aria-label="Filtrar elenco">
            <button
              type="button"
              role="tab"
              aria-selected={aba === 'todos'}
              className={
                aba === 'todos'
                  ? 'market-player-tab market-player-tab--active'
                  : 'market-player-tab'
              }
              onClick={() => {
                setAba('todos');
                resetarPagina();
              }}
            >
              Todos <span>{contagens.todos}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={aba === 'livres'}
              className={
                aba === 'livres'
                  ? 'market-player-tab market-player-tab--active'
                  : 'market-player-tab'
              }
              onClick={() => {
                setAba('livres');
                setClubeFiltro('');
                resetarPagina();
              }}
            >
              Livres <span>{contagens.livres}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={aba === 'clubes'}
              className={
                aba === 'clubes'
                  ? 'market-player-tab market-player-tab--active'
                  : 'market-player-tab'
              }
              onClick={() => {
                setAba('clubes');
                resetarPagina();
              }}
            >
              Em clubes <span>{contagens.clubes}</span>
            </button>
          </div>
          <label className="market-sort">
            <span>Ordenar por</span>
            <select
              value={ordenacao}
              onChange={(event) => {
                setOrdenacao(event.target.value as OrdenacaoJogadores);
                resetarPagina();
              }}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown size={12} aria-hidden="true" />
          </label>
        </div>

        <div
          className="market-players-table-scroll"
          role="region"
          aria-label="Jogadores"
          tabIndex={0}
        >
          <table className="market-players-table">
            <thead>
              <tr>
                <th scope="col">Jogador</th>
                <th scope="col">Posição</th>
                <th scope="col">Overall</th>
                <th scope="col">Agilidade</th>
                <th scope="col">Idade</th>
                <th scope="col">Condição</th>
                <th scope="col" className="market-players-table__money">
                  Valor base
                </th>
                <th scope="col" className="market-players-table__money">
                  Valor de mercado
                </th>
                <th scope="col">Clube</th>
                <th scope="col" className="market-players-table__action">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {!carregando &&
                !erro &&
                jogadores.map((jogador) => {
                  const club = clubes.find((item) => item.id === jogador.club_id);
                  return (
                    <tr key={jogador.id}>
                      <td className="market-player-cell">
                        <span
                          className={`market-player-avatar market-player-avatar--${jogador.id % 6}`}
                        >
                          {initials(jogador.name)}
                        </span>
                        <span className="market-player-name">
                          <strong>{jogador.name}</strong>
                          <small>{positionName(jogador.position)}</small>
                        </span>
                      </td>
                      <td>
                        <span className="market-position">{jogador.position}</span>
                      </td>
                      <td className="market-player-overall">{jogador.overall}</td>
                      <td>
                        <span className="market-agility">
                          <span>{jogador.agility}</span>
                          <span className="market-agility__track" aria-hidden="true">
                            <span
                              className={
                                jogador.agility >= 70
                                  ? 'market-agility__value market-agility__value--high'
                                  : jogador.agility >= 40
                                    ? 'market-agility__value market-agility__value--medium'
                                    : 'market-agility__value market-agility__value--low'
                              }
                              style={{ width: `${Math.min(Math.max(jogador.agility, 0), 100)}%` }}
                            />
                          </span>
                        </span>
                      </td>
                      <td>{jogador.age}</td>
                      <td>
                        <span
                          className={`market-condition market-condition--${jogador.condition.toLowerCase()}`}
                        >
                          <span aria-hidden="true" />
                          {conditionLabel(jogador.condition)}
                        </span>
                      </td>
                      <td className="market-players-table__money">
                        {formatAmount(jogador.base_value)}
                      </td>
                      <td className="market-players-table__money market-value-strong">
                        {formatAmount(jogador.market_value)}
                      </td>
                      <td>
                        {club ? (
                          <span className="market-club-name">
                            <small>{club.acronym}</small>
                            {club.name}
                          </span>
                        ) : (
                          <span className="market-free-label">Livre</span>
                        )}
                      </td>
                      <td className="market-players-table__action">
                        <div className="market-row-actions">
                          {jogador.club_id === null || jogador.club_id === undefined ? (
                            <button
                              className="market-buy-button"
                              type="button"
                              disabled={Boolean(jogadorCompra) || comprando}
                              onClick={() => abrirCompra(jogador)}
                            >
                              <ShoppingCart size={12} />
                              Comprar
                            </button>
                          ) : club ? (
                            <Link
                              className="market-buy-button"
                              to={`/clubs/${club.id}`}
                              aria-label={`Abrir clube ${club.name}`}
                              title={`Abrir ${club.name}`}
                            >
                              {club.acronym}
                            </Link>
                          ) : null}
                          <button
                            className="market-row-menu-button"
                            type="button"
                            aria-label={`Mais ações para ${jogador.name}`}
                            aria-haspopup="menu"
                            aria-expanded={menuAcoesJogadorId === jogador.id}
                            aria-controls={`player-actions-${jogador.id}`}
                            onClick={(event) => {
                              if (menuAcoesJogadorId === jogador.id) {
                                setMenuAcoesJogadorId(null);
                                setMenuAcoesPosition(null);
                                return;
                              }
                              const bounds = event.currentTarget.getBoundingClientRect();
                              setMenuAcoesPosition({
                                top: Math.min(bounds.bottom + 4, window.innerHeight - 250),
                                left: Math.min(bounds.right - 176, window.innerWidth - 184),
                              });
                              setMenuAcoesJogadorId(jogador.id);
                            }}
                          >
                            <MoreHorizontal size={15} />
                          </button>
                          {menuAcoesJogadorId === jogador.id &&
                            menuAcoesPosition &&
                            createPortal(
                              <div
                                className="market-player-actions-menu"
                                id={`player-actions-${jogador.id}`}
                                role="menu"
                                aria-label={`Ações para ${jogador.name}`}
                                style={{
                                  top: menuAcoesPosition.top,
                                  left: menuAcoesPosition.left,
                                }}
                              >
                                <span className="market-player-actions-menu__title">
                                  Mais ações
                                </span>
                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={() => {
                                    setJogadorDetalhes(jogador);
                                    setMenuAcoesJogadorId(null);
                                    setMenuAcoesPosition(null);
                                  }}
                                >
                                  <Eye size={13} />
                                  Ver detalhes
                                </button>
                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={() => abrirEdicao(jogador)}
                                >
                                  <Pencil size={13} />
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={() => abrirCondicao(jogador)}
                                >
                                  <HeartPulse size={13} />
                                  Alterar condição física
                                </button>
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="market-player-actions-menu__unavailable"
                                  disabled
                                  title="A API atual não oferece renovação de contrato."
                                >
                                  <Handshake size={13} />
                                  <span>
                                    Renovar contrato
                                    <small>Indisponível no momento</small>
                                  </span>
                                </button>
                                {jogador.club_id === null || jogador.club_id === undefined ? (
                                  <button
                                    type="button"
                                    role="menuitem"
                                    disabled={Boolean(jogadorCompra) || comprando}
                                    onClick={() => {
                                      setMenuAcoesJogadorId(null);
                                      setMenuAcoesPosition(null);
                                      abrirCompra(jogador);
                                    }}
                                  >
                                    <ShoppingCart size={13} />
                                    Comprar
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    role="menuitem"
                                    disabled
                                    title="O jogador já pertence a um clube."
                                  >
                                    <ShoppingCart size={13} />
                                    Comprar
                                  </button>
                                )}
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="market-player-actions-menu__delete"
                                  disabled={
                                    jogador.club_id !== null && jogador.club_id !== undefined
                                  }
                                  title={
                                    jogador.club_id !== null && jogador.club_id !== undefined
                                      ? 'Jogadores pertencentes a clubes não podem ser excluídos.'
                                      : undefined
                                  }
                                  onClick={() => confirmarExclusao(jogador)}
                                >
                                  <Trash2 size={13} />
                                  Excluir
                                </button>
                                {jogador.club_id !== null && jogador.club_id !== undefined && (
                                  <p className="market-player-actions-menu__hint">
                                    Jogadores só podem ser excluídos quando estão livres.
                                  </p>
                                )}
                              </div>,
                              document.body,
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          {carregando && (
            <LoadingState
              skeleton
              title="Carregando jogadores"
              description="Carregando..."
            />
          )}
          {!carregando && erro && (
            <ErrorState
              title="Não foi possível carregar os jogadores"
              description="Não foi possível carregar os dados. Verifique a conexão e tente de novo."
              icon={<SearchX size={16} />}
              onRetry={() => setReloadKey((current) => current + 1)}
            />
          )}
          {!carregando && !erro && !filterError && jogadores.length === 0 && (
            <EmptyState
              title={busca.trim() ? `Nenhum jogador encontrado para “${busca.trim()}”` : 'Nenhum jogador cadastrado'}
              description={
                busca.trim()
                  ? 'Confira a grafia ou tente alguns filtros. A busca ignora maiúsculas, minúsculas e acentos.'
                  : 'Cadastre o primeiro jogador para começar.'
              }
              icon={<SearchX size={16} />}
              actionLabel={activeFilters.length > 0 ? 'Limpar filtros' : 'Novo jogador'}
              onAction={activeFilters.length > 0 ? limparFiltros : () => setFormularioAberto(true)}
            />
          )}
        </div>

        <footer className="market-players-footer">
          <span>
            Mostrando {firstVisible}–{lastVisible} de {total} jogadores
          </span>
          <nav className="market-pagination" aria-label="Paginação de jogadores">
            <button
              type="button"
              className="market-pagination__text"
              disabled={carregando || pagina <= 1}
              onClick={() => setPagina((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft size={12} />
              Anterior
            </button>
            {pageButtons(pagina, totalPaginas).map((page) => (
              <button
                type="button"
                key={page}
                aria-label={`Página ${page}`}
                aria-current={pagina === page ? 'page' : undefined}
                className={
                  pagina === page
                    ? 'market-pagination__page market-pagination__page--active'
                    : 'market-pagination__page'
                }
                disabled={carregando}
                onClick={() => setPagina(page)}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              className="market-pagination__text"
              disabled={carregando || pagina >= totalPaginas}
              onClick={() => setPagina((current) => Math.min(totalPaginas, current + 1))}
            >
              Próxima
              <ChevronRight size={12} />
            </button>
          </nav>
        </footer>
      </section>

      <p className="market-players-note">
        {aba === 'livres'
          ? 'Com a aba “Livres” ativa, o filtro Clube fica desabilitado, porque essa combinação não é aceita.'
          : 'Os filtros se combinam: a lista mostra apenas jogadores que atendem a todos os critérios. A busca ignora maiúsculas, minúsculas e acentos; o intervalo usa valor de mercado, nunca valor base.'}
      </p>

      {jogadorCompra && (
        <div
          className="market-buy-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !comprando) setJogadorCompra(null);
          }}
        >
          <section
            className="market-buy-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="market-buy-title"
          >
            <button
              className="market-buy-dialog__close"
              type="button"
              aria-label="Fechar compra"
              disabled={comprando}
              onClick={() => setJogadorCompra(null)}
            >
              ×
            </button>
            <div className="market-buy-dialog__heading">
              <span className="market-buy-dialog__icon">
                <ShoppingCart size={18} />
              </span>
              <div>
                <h2 id="market-buy-title">Comprar jogador</h2>
                <p>Escolha o clube comprador e até quando vai a fidelidade do contrato.</p>
              </div>
            </div>
            <div className="market-buy-dialog__player">
              <span className="market-player-avatar" aria-hidden="true">
                {jogadorCompra.name
                  .split(/\s+/)
                  .map((part) => part[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
              <span className="market-buy-dialog__player-info">
                <strong>{jogadorCompra.name}</strong>
                <small>
                  {jogadorCompra.position} · {jogadorCompra.age} anos
                </small>
              </span>
              <strong className="market-buy-dialog__player-value">
                {formatCurrency(jogadorCompra.market_value)}
              </strong>
            </div>
            <form onSubmit={confirmarCompra} noValidate>
              {erroCompra && (
                <div className="market-buy-error" role="alert">
                  <strong>
                    {erroCompra.toLowerCase().includes('rede')
                      ? 'Não foi possível conectar ao servidor'
                      : 'Compra recusada'}
                  </strong>
                  {erroCompra}
                </div>
              )}
              <label className="market-buy-field" htmlFor="buyer-club">
                <span>
                  Clube comprador <b>*</b>
                </span>
                <select
                  id="buyer-club"
                  value={clubeId}
                  onChange={(event) => {
                    setClubeId(event.target.value);
                    setErrosCampos((current) => ({ ...current, clubId: undefined }));
                  }}
                  aria-invalid={Boolean(errosCampos.clubId)}
                >
                  <option value="">Selecione um clube</option>
                  {clubes.map((clube) => (
                    <option key={clube.id} value={clube.id}>
                      {clube.name} ({clube.acronym})
                    </option>
                  ))}
                </select>
                {clubeId && (
                  <small className="market-buy-field__cash">
                    Caixa atual:{' '}
                    {formatCurrency(
                      clubes.find((clube) => String(clube.id) === clubeId)?.cash ?? 0,
                    )}
                  </small>
                )}
                {errosCampos.clubId && <small>{errosCampos.clubId}</small>}
              </label>
              <p className="market-buy-dialog__hint">
                O custo total inclui o valor do jogador e a taxa de 5% para valores acima de
                30,00. O clube precisa manter o custo dentro de 50% do caixa disponível.
              </p>
              <label className="market-buy-field" htmlFor="loyalty-until">
                <span>
                  Fim da fidelidade <b>*</b>
                </span>
                <input
                  id="loyalty-until"
                  type="datetime-local"
                  value={fidelidadeAte}
                  onChange={(event) => {
                    setFidelidadeAte(event.target.value);
                    setErrosCampos((current) => ({ ...current, loyaltyUntil: undefined }));
                  }}
                  aria-invalid={Boolean(errosCampos.loyaltyUntil)}
                />
                <small className={errosCampos.loyaltyUntil ? 'market-buy-field__error' : ''}>
                  {errosCampos.loyaltyUntil ||
                    'A fidelidade começa na confirmação. Horário de Brasília (UTC−3).'}
                </small>
              </label>
              <output className="market-buy-dialog__loyalty">
                {fidelidadeAte
                  ? `Contrato com fidelidade até ${formatDateTimeLocalBrasilia(
                      new Date(`${fidelidadeAte}:00`),
                    )}`
                  : 'Informe o fim da fidelidade.'}
              </output>
              <footer className="market-buy-dialog__actions">
                <button
                  type="button"
                  className="market-buy-cancel"
                  disabled={comprando}
                  onClick={() => setJogadorCompra(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className="market-buy-confirm" disabled={comprando}>
                  {comprando ? <span className="market-spinner" /> : <ShoppingCart size={15} />}
                  {comprando ? 'Enviando...' : 'Confirmar compra'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {formularioAberto && (
        <div
          className="market-buy-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !cadastrando) setFormularioAberto(false);
          }}
        >
          <section
            className="market-create-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="market-create-title"
          >
            <button
              className="market-buy-dialog__close"
              type="button"
              aria-label="Fechar cadastro"
              disabled={cadastrando}
              onClick={() => setFormularioAberto(false)}
            >
              ×
            </button>
            <header className="market-create-dialog__header">
              <div>
                <h2 id="market-create-title">Novo jogador</h2>
                <p
                  role={
                    cadastroTentado && Object.keys(errosCadastro).length > 0 ? 'alert' : undefined
                  }
                >
                  {cadastroTentado && Object.keys(errosCadastro).length > 0
                    ? 'Corrija os campos destacados para salvar.'
                    : 'Preencha os dados e os indicadores técnicos. O valor base, o overall e o valor de mercado são calculados ao salvar.'}
                </p>
              </div>
            </header>
            <form className="market-create-form" onSubmit={cadastrarJogador} noValidate>
              {erroCadastro && (
                <div className="market-buy-error" role="alert">
                  {erroCadastro}
                </div>
              )}
              <label className="market-create-field market-create-field--name">
                <span>Nome</span>
                <input
                  id="new-player-name"
                  autoComplete="name"
                  maxLength={100}
                  value={formJogador.name}
                  aria-invalid={Boolean(cadastroTentado && errosCadastro.name)}
                  aria-describedby="new-player-name-hint"
                  onChange={(event) =>
                    setFormJogador((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Nome e sobrenome"
                />
                <small
                  id="new-player-name-hint"
                  className={
                    cadastroTentado && errosCadastro.name ? 'market-create-field__error' : ''
                  }
                >
                  {cadastroTentado && errosCadastro.name
                    ? errosCadastro.name
                    : 'De 3 a 100 caracteres, com pelo menos duas palavras e sem números.'}
                </small>
              </label>

              <fieldset
                className={
                  cadastroTentado && errosCadastro.position
                    ? 'market-position-picker market-position-picker--invalid'
                    : 'market-position-picker'
                }
                aria-describedby={
                  cadastroTentado && errosCadastro.position
                    ? 'new-player-position-error'
                    : undefined
                }
              >
                <legend>Posição</legend>
                <div className="market-position-picker__options">
                  {positions.map((position) => (
                    <label
                      className={
                        formJogador.position === position.value
                          ? 'market-position-choice market-position-choice--selected'
                          : 'market-position-choice'
                      }
                      key={position.value}
                    >
                      <input
                        type="radio"
                        name="new-player-position"
                        value={position.value}
                        checked={formJogador.position === position.value}
                        aria-invalid={Boolean(cadastroTentado && errosCadastro.position)}
                        onChange={() =>
                          setFormJogador((current) => ({
                            ...current,
                            position: position.value,
                          }))
                        }
                      />
                      <strong>{position.value}</strong>
                      <small>{position.label}</small>
                    </label>
                  ))}
                </div>
                {cadastroTentado && errosCadastro.position && (
                  <small id="new-player-position-error" className="market-create-field__error">
                    {errosCadastro.position}
                  </small>
                )}
              </fieldset>

              <div className="market-create-profile">
                <label className="market-create-field">
                  <span>Idade</span>
                  <input
                    type="number"
                    min={16}
                    max={45}
                    value={formJogador.age || ''}
                    aria-invalid={Boolean(cadastroTentado && errosCadastro.age)}
                    aria-describedby="new-player-age-hint"
                    onChange={(event) =>
                      setFormJogador((current) => ({
                        ...current,
                        age: Number(event.target.value),
                      }))
                    }
                    placeholder="—"
                  />
                  <small
                    id="new-player-age-hint"
                    className={
                      cadastroTentado && errosCadastro.age ? 'market-create-field__error' : ''
                    }
                  >
                    {cadastroTentado && errosCadastro.age ? errosCadastro.age : 'De 16 a 45 anos.'}
                  </small>
                </label>
                <label className="market-create-field">
                  <span>Agilidade</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={formJogador.agility || ''}
                    aria-invalid={Boolean(cadastroTentado && errosCadastro.agility)}
                    aria-describedby="new-player-agility-hint"
                    onChange={(event) =>
                      setFormJogador((current) => ({
                        ...current,
                        agility: Number(event.target.value),
                      }))
                    }
                    placeholder="—"
                  />
                  <small
                    id="new-player-agility-hint"
                    className={
                      cadastroTentado && errosCadastro.agility ? 'market-create-field__error' : ''
                    }
                  >
                    {cadastroTentado && errosCadastro.agility
                      ? errosCadastro.agility
                      : 'De 1 a 100; até 85 com 35 anos ou mais.'}
                  </small>
                </label>
                <div className="market-create-field">
                  <span>Valor base (moedas)</span>
                  <output className="market-create-readonly">Após salvar</output>
                  <small>Calculado no cadastro.</small>
                </div>
              </div>

              <section
                className="market-create-technical"
                aria-labelledby="technical-indicators-title"
              >
                <div className="market-create-technical__main">
                  <div className="market-create-section-heading">
                    <h3 id="technical-indicators-title">Indicadores técnicos</h3>
                    <p>
                      Seis atributos e o potencial, de 1 a 99. Não mudam depois do cadastro; a soma
                      dos seis atributos não pode passar de 480.
                    </p>
                  </div>
                  <div className="market-attribute-fields">
                    {technicalAttributes.map(({ key, label }) => (
                      <label className="market-create-field" key={key}>
                        <span>{label}</span>
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={formJogador[key] || ''}
                          aria-invalid={Boolean(cadastroTentado && errosCadastro[key])}
                          aria-describedby={
                            cadastroTentado && errosCadastro[key]
                              ? `new-player-${key}-error`
                              : undefined
                          }
                          onChange={(event) =>
                            setFormJogador((current) => ({
                              ...current,
                              [key]: Number(event.target.value),
                            }))
                          }
                          placeholder="—"
                        />
                        {cadastroTentado && errosCadastro[key] && (
                          <small
                            id={`new-player-${key}-error`}
                            className="market-create-field__error"
                          >
                            {errosCadastro[key]}
                          </small>
                        )}
                      </label>
                    ))}
                    <label className="market-create-field">
                      <span>Potencial</span>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={formJogador.potential || ''}
                        aria-invalid={Boolean(cadastroTentado && errosCadastro.potential)}
                        aria-describedby="new-player-potential-hint"
                        onChange={(event) =>
                          setFormJogador((current) => ({
                            ...current,
                            potential: Number(event.target.value),
                          }))
                        }
                        placeholder="—"
                      />
                      <small
                        id="new-player-potential-hint"
                        className={
                          cadastroTentado && errosCadastro.potential
                            ? 'market-create-field__error'
                            : ''
                        }
                      >
                        {cadastroTentado && errosCadastro.potential
                          ? errosCadastro.potential
                          : 'Igual ou maior que o melhor atributo; com 33+, deve ser igual.'}
                      </small>
                    </label>
                    <div className="market-create-field">
                      <span>Overall</span>
                      <output className="market-create-readonly">Após salvar</output>
                      <small>Calculado no cadastro.</small>
                    </div>
                  </div>
                </div>
                <aside className="market-player-preview" aria-label="Prévia dos atributos">
                  <h4>Prévia dos atributos</h4>
                  {technicalAttributes.map(({ key, label }) => {
                    const value = formJogador[key];
                    return (
                      <div className="market-player-preview__row" key={key}>
                        <span>{label}</span>
                        <span className="market-player-preview__track" aria-hidden="true">
                          <span style={{ width: `${Math.min(Math.max(value, 0), 99)}%` }} />
                        </span>
                        <strong>{value || '—'}</strong>
                      </div>
                    );
                  })}
                  <p>Overall e valores calculados ao salvar.</p>
                </aside>
              </section>

              <footer className="market-create-dialog__footer">
                <p>
                  <UsersRound size={12} />O jogador começa livre e Apto.
                </p>
                <div className="market-buy-dialog__actions">
                  <button
                    type="button"
                    className="market-buy-cancel"
                    disabled={cadastrando}
                    onClick={() => setFormularioAberto(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="market-buy-confirm" disabled={cadastrando}>
                    {cadastrando ? <span className="market-spinner" /> : <Plus size={15} />}
                    {cadastrando ? 'Salvando...' : 'Salvar jogador'}
                  </button>
                </div>
              </footer>
            </form>
          </section>
        </div>
      )}

      {jogadorCondicao && (
        <div
          className="market-buy-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !salvandoCondicao) {
              setJogadorCondicao(null);
            }
          }}
        >
          <section
            className="market-condition-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="market-condition-title"
          >
            <header className="market-condition-dialog__header">
              <h2 id="market-condition-title">Alterar condição física</h2>
              <p>A condição muda o desconto do valor de mercado, calculado ao salvar.</p>
            </header>
            <form
              className="market-condition-dialog__form"
              onSubmit={(event) => {
                event.preventDefault();
                void salvarCondicao(condicaoSelecionada);
              }}
              noValidate
            >
              <div className="market-condition-dialog__player">
                <span
                  className={`market-player-avatar market-player-avatar--${jogadorCondicao.id % 6}`}
                  aria-hidden="true"
                >
                  {initials(jogadorCondicao.name)}
                </span>
                <strong className="market-condition-dialog__player-name">
                  {jogadorCondicao.name}
                </strong>
                <span
                  className={`market-condition market-condition--${normalizeCondition(
                    jogadorCondicao.condition,
                  ).toLowerCase()}`}
                >
                  <span />
                  {conditionLabel(jogadorCondicao.condition)}
                </span>
              </div>
              {erroCondicao && (
                <div className="market-buy-error" role="alert">
                  {erroCondicao}
                </div>
              )}
              <div
                className="market-condition-dialog__options"
                role="radiogroup"
                aria-label="Condição física do jogador"
              >
                {conditionOptions.map((option, index) => {
                  const selecionada = condicaoSelecionada === option.value;
                  const bloqueada =
                    option.value === 'APTO' &&
                    normalizeCondition(jogadorCondicao.condition) === 'DOENTE';
                  return (
                    <div key={option.value}>
                      {index > 0 && <span className="market-condition-dialog__separator" />}
                      <label
                        className={
                          selecionada
                            ? 'market-condition-option market-condition-option--selected'
                            : 'market-condition-option'
                        }
                      >
                        <input
                          type="radio"
                          name="player-condition"
                          value={option.value}
                          checked={selecionada}
                          disabled={bloqueada}
                          onChange={() => setCondicaoSelecionada(option.value)}
                        />
                        <span className="market-condition-option__text">
                          <strong>{option.label}</strong>
                          {option.description.map((descricao) => (
                            <small key={descricao}>{descricao}</small>
                          ))}
                        </span>
                      </label>
                    </div>
                  );
                })}
              </div>
              <footer className="market-condition-dialog__footer">
                <button
                  type="button"
                  className="market-condition-dialog__cancel"
                  disabled={salvandoCondicao}
                  onClick={() => setJogadorCondicao(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="market-condition-dialog__confirm"
                  disabled={salvandoCondicao}
                >
                  {salvandoCondicao ? <span className="market-spinner" /> : <Check size={13} />}
                  {salvandoCondicao ? 'Salvando...' : 'Salvar condição'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {jogadorEdicao && formEdicao && (
        <div
          className="market-buy-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !salvandoEdicao) {
              setJogadorEdicao(null);
              setFormEdicao(null);
            }
          }}
        >
          <section
            className="market-edit-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="market-edit-title"
          >
            <button
              className="market-buy-dialog__close"
              type="button"
              aria-label="Fechar edição"
              disabled={salvandoEdicao}
              onClick={() => {
                setJogadorEdicao(null);
                setFormEdicao(null);
              }}
            >
              ×
            </button>
            <header className="market-edit-dialog__header">
              <h2 id="market-edit-title">Editar jogador</h2>
              <p>
                Edite nome, posição, idade e agilidade. Os indicadores técnicos não são alterados.
              </p>
            </header>
            <form className="market-create-form" onSubmit={salvarEdicao} noValidate>
              {erroEdicao && (
                <div className="market-buy-error" role="alert">
                  {erroEdicao}
                </div>
              )}
              <label className="market-create-field market-create-field--name">
                <span>Nome</span>
                <input
                  id="edit-player-name"
                  autoComplete="name"
                  maxLength={100}
                  value={formEdicao.name}
                  aria-invalid={Boolean(edicaoTentada && errosEdicaoForm.name)}
                  aria-describedby="edit-player-name-hint"
                  onChange={(event) =>
                    setFormEdicao((current) =>
                      current ? { ...current, name: event.target.value } : current,
                    )
                  }
                />
                <small
                  id="edit-player-name-hint"
                  className={
                    edicaoTentada && errosEdicaoForm.name ? 'market-create-field__error' : ''
                  }
                >
                  {edicaoTentada && errosEdicaoForm.name
                    ? errosEdicaoForm.name
                    : 'De 3 a 100 caracteres, com pelo menos duas palavras e sem números.'}
                </small>
              </label>
              <fieldset
                className={
                  edicaoTentada && errosEdicaoForm.position
                    ? 'market-position-picker market-position-picker--invalid'
                    : 'market-position-picker'
                }
                aria-describedby={
                  edicaoTentada && errosEdicaoForm.position
                    ? 'edit-player-position-hint'
                    : undefined
                }
              >
                <legend>Posição</legend>
                <div className="market-position-picker__options">
                  {positions.map((position) => (
                    <label
                      className={
                        formEdicao.position === position.value
                          ? 'market-position-choice market-position-choice--selected'
                          : 'market-position-choice'
                      }
                      key={position.value}
                    >
                      <input
                        type="radio"
                        name="edit-player-position"
                        value={position.value}
                        checked={formEdicao.position === position.value}
                        disabled={
                          jogadorEdicao.club_id !== null && jogadorEdicao.club_id !== undefined
                        }
                        aria-invalid={Boolean(edicaoTentada && errosEdicaoForm.position)}
                        onChange={() =>
                          setFormEdicao((current) =>
                            current ? { ...current, position: position.value } : current,
                          )
                        }
                      />
                      <strong>{position.value}</strong>
                      <small>{position.label}</small>
                    </label>
                  ))}
                </div>
                <small
                  id="edit-player-position-hint"
                  className={
                    edicaoTentada && errosEdicaoForm.position
                      ? 'market-create-field__error'
                      : 'market-position-picker__hint'
                  }
                >
                  {edicaoTentada && errosEdicaoForm.position
                    ? errosEdicaoForm.position
                    : jogadorEdicao.club_id !== null && jogadorEdicao.club_id !== undefined
                      ? 'A posição não pode ser alterada enquanto o jogador estiver em um clube.'
                      : 'Selecione uma posição.'}
                </small>
              </fieldset>
              <div className="market-create-profile market-edit-dialog__profile">
                <label className="market-create-field">
                  <span>Idade</span>
                  <input
                    type="number"
                    min={jogadorEdicao.age}
                    max={45}
                    value={formEdicao.age}
                    aria-invalid={Boolean(edicaoTentada && errosEdicaoForm.age)}
                    aria-describedby="edit-player-age-hint"
                    onChange={(event) =>
                      setFormEdicao((current) =>
                        current ? { ...current, age: Number(event.target.value) } : current,
                      )
                    }
                  />
                  <small
                    id="edit-player-age-hint"
                    className={
                      edicaoTentada && errosEdicaoForm.age ? 'market-create-field__error' : ''
                    }
                  >
                    {edicaoTentada && errosEdicaoForm.age
                      ? errosEdicaoForm.age
                      : `De ${jogadorEdicao.age} a 45 anos; a idade não pode diminuir.`}
                  </small>
                </label>
                <label className="market-create-field">
                  <span>Agilidade</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={formEdicao.agility}
                    aria-invalid={Boolean(edicaoTentada && errosEdicaoForm.agility)}
                    aria-describedby="edit-player-agility-hint"
                    onChange={(event) =>
                      setFormEdicao((current) =>
                        current ? { ...current, agility: Number(event.target.value) } : current,
                      )
                    }
                  />
                  <small
                    id="edit-player-agility-hint"
                    className={
                      edicaoTentada && errosEdicaoForm.agility ? 'market-create-field__error' : ''
                    }
                  >
                    {edicaoTentada && errosEdicaoForm.agility
                      ? errosEdicaoForm.agility
                      : 'De 1 a 100; até 85 com 35 anos ou mais.'}
                  </small>
                </label>
              </div>
              <footer className="market-create-dialog__footer">
                <p>
                  <UsersRound size={12} />
                  {jogadorEdicao.club_id === null || jogadorEdicao.club_id === undefined
                    ? 'Jogador livre.'
                    : `Em ${clubes.find((item) => item.id === jogadorEdicao.club_id)?.name ?? 'um clube'}.`}
                </p>
                <div className="market-buy-dialog__actions">
                  <button
                    type="button"
                    className="market-buy-cancel"
                    disabled={salvandoEdicao}
                    onClick={() => {
                      setJogadorEdicao(null);
                      setFormEdicao(null);
                    }}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="market-buy-confirm" disabled={salvandoEdicao}>
                    {salvandoEdicao ? <span className="market-spinner" /> : <Check size={14} />}
                    {salvandoEdicao ? 'Salvando...' : 'Salvar alterações'}
                  </button>
                </div>
              </footer>
            </form>
          </section>
        </div>
      )}

      {jogadorDetalhes && (
        <DetalhesJogadorDialog
          player={jogadorDetalhes}
          clubes={clubes}
          onClose={() => setJogadorDetalhes(null)}
          onEdit={(player) => abrirEdicao(player)}
          onChangeCondition={(player) => abrirCondicao(player)}
          onBuy={(player) => setJogadorCompra(player)}
        />
      )}

      {jogadorExclusao && (
        <div
          className="market-create-result-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !excluindoJogador) {
              setJogadorExclusao(null);
            }
          }}
        >
          <section
            className="market-delete-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="market-delete-title"
            aria-describedby="market-delete-description"
          >
            <h2 id="market-delete-title">Excluir jogador?</h2>
            <p id="market-delete-description">
              {jogadorExclusao.name} será removido da lista. Esta ação não pode ser desfeita.
            </p>
            {erroExclusao && (
              <div className="market-buy-error" role="alert">
                {erroExclusao}
              </div>
            )}
            <footer className="market-create-result__actions">
              <button
                type="button"
                className="market-create-result__details-button"
                disabled={excluindoJogador}
                onClick={() => setJogadorExclusao(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="market-delete-dialog__confirm"
                disabled={excluindoJogador}
                onClick={() => void excluirJogador()}
              >
                <Trash2 size={13} />
                {excluindoJogador ? 'Excluindo...' : 'Excluir jogador'}
              </button>
            </footer>
          </section>
        </div>
      )}

      {resultado && (
        <TransactionResultDialog result={resultado} onClose={() => setResultado(null)} />
      )}
      {cadastroResultado && (
        <div
          className="market-create-result-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCadastroResultado(null);
          }}
        >
          <section
            className="market-create-result"
            role="dialog"
            aria-modal="true"
            aria-labelledby="market-create-result-title"
          >
            <span className="market-create-result__icon" aria-hidden="true">
              <Check size={18} />
            </span>
            <h2 id="market-create-result-title">Jogador cadastrado</h2>
            <p className="market-create-result__summary">
              {cadastroResultado.name} entrou{' '}
              {cadastroResultado.club_id === null || cadastroResultado.club_id === undefined
                ? 'livre'
                : 'em um clube'}{' '}
              e {conditionLabel(cadastroResultado.condition)}. Valores em moedas, calculados pela
              API ao salvar.
            </p>
            <dl className="market-create-result__values">
              <div>
                <dt>Valor base</dt>
                <dd>{formatAmount(cadastroResultado.base_value)}</dd>
                <small>Calculado no cadastro; não muda depois.</small>
              </div>
              <div>
                <dt>Valor de mercado</dt>
                <dd>{formatAmount(cadastroResultado.market_value)}</dd>
                <small>Com condição, agilidade e idade.</small>
              </div>
              <div>
                <dt>Overall</dt>
                <dd>{cadastroResultado.overall}</dd>
                <small>Calculado pela posição e pelos indicadores.</small>
              </div>
            </dl>
            {mostrarDetalhesCadastro && (
              <dl className="market-create-result__details">
                <div>
                  <dt>Posição</dt>
                  <dd>{positionName(cadastroResultado.position)}</dd>
                </div>
                <div>
                  <dt>Idade</dt>
                  <dd>{cadastroResultado.age} anos</dd>
                </div>
                <div>
                  <dt>Agilidade</dt>
                  <dd>{cadastroResultado.agility}</dd>
                </div>
                {technicalAttributes.map(({ key, label }) => (
                  <div key={key}>
                    <dt>{label}</dt>
                    <dd>{cadastroResultado[key] ?? '—'}</dd>
                  </div>
                ))}
                <div>
                  <dt>Potencial</dt>
                  <dd>{cadastroResultado.potential ?? '—'}</dd>
                </div>
              </dl>
            )}
            <footer className="market-create-result__actions">
              <button
                type="button"
                className="market-create-result__details-button"
                aria-expanded={mostrarDetalhesCadastro}
                onClick={() => setMostrarDetalhesCadastro((visible) => !visible)}
              >
                <Eye size={14} />
                {mostrarDetalhesCadastro ? 'Ocultar detalhes' : 'Ver detalhes'}
              </button>
              <button
                type="button"
                className="market-create-result__close"
                onClick={() => setCadastroResultado(null)}
              >
                Fechar
              </button>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}

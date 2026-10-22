import {
  ArrowRight,
  Clock3,
  Crosshair,
  History,
  Shield,
  ShoppingCart,
  Trophy,
  UsersRound,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import './HomePage.css';

const steps = [
  {
    number: '01',
    title: 'Jogadores',
    description: 'Nascem livres e Apto; o valor de mercado vem da condição, agilidade e idade.',
    icon: UsersRound,
    to: '/players',
  },
  {
    number: '02',
    title: 'Clubes',
    description: 'Começam com 300,00 em caixa e sem jogadores.',
    icon: Shield,
    to: '/clubs',
  },
  {
    number: '03',
    title: 'Compra',
    description: 'Valor + taxa, até 50% do caixa, com contrato de fidelidade.',
    icon: ShoppingCart,
    to: '/players',
  },
  {
    number: '04',
    title: 'Venda',
    description: 'Multa antes do fim da fidelidade e comissão sobre o lucro.',
    icon: Crosshair,
    to: '/clubs',
  },
  {
    number: '05',
    title: 'Histórico',
    description: 'Toda compra e venda fica registrada, com totais e CSV.',
    icon: History,
    to: '/clubs',
  },
  {
    number: '06',
    title: 'Liga',
    description: 'Escale os 5 titulares e jogue partidas que entram na classificação.',
    icon: Trophy,
    to: '/matches',
  },
];

export default function HomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    function handleEnter(event: KeyboardEvent) {
      if (event.key === 'Enter') navigate('/clubs');
    }

    window.addEventListener('keydown', handleEnter);
    return () => window.removeEventListener('keydown', handleEnter);
  }, [navigate]);

  return (
    <main className="home-page">
      <section className="home-board" aria-labelledby="home-title">
        <div className="home-board__pitch" aria-hidden="true">
          <span className="home-board__pitch-line home-board__pitch-line--top" />
          <span className="home-board__pitch-line home-board__pitch-line--bottom" />
          <span className="home-board__pitch-circle" />
          <span className="home-board__pitch-dot home-board__pitch-dot--left" />
          <span className="home-board__pitch-dot home-board__pitch-dot--right" />
        </div>

        <header className="home-header">
          <div className="home-brand" aria-label="Passe">
            <span className="home-brand__mark">P</span>
            <strong>Passe</strong>
          </div>
          <div className="home-league-badge">
            <span aria-hidden="true" />
            Liga Fictícia 2026 <small>· líder: Delta FC, 6 pontos</small>
          </div>
        </header>

        <section className="home-intro">
          <h1 id="home-title">Gestão da liga, do mercado à classificação</h1>
          <p>
            Cadastre jogadores, monte os clubes e negocie com contrato de fidelidade. Depois,
            <br />
            escale os titulares e jogue partidas com placar calculado pelos atributos.
          </p>
          <Link className="home-start-button" to="/clubs">
            Iniciar <ArrowRight size={13} />
          </Link>
          <span className="home-enter-hint">ou tecle <kbd>Enter</kbd></span>
        </section>

        <div className="home-stats" aria-label="Resumo da liga">
          <span><UsersRound size={11} />23 jogadores</span>
          <span><UsersRound size={11} />7 livres</span>
          <span><Shield size={11} />6 clubes</span>
          <span><Crosshair size={11} />2 partidas</span>
          <span><Clock3 size={11} />Não precisa de login</span>
        </div>

        <nav className="home-steps" aria-label="Módulos da aplicação">
          {steps.map(({ number, title, description, icon: Icon, to }, index) => (
            <Link className="home-step" to={to} key={number}>
              <div className="home-step__top">
                <span className="home-step__icon"><Icon size={13} /></span>
                <small>{number}</small>
              </div>
              <strong>{title}</strong>
              <p>{description}</p>
              {index < steps.length - 1 && <ArrowRight className="home-step__arrow" size={12} />}
            </Link>
          ))}
        </nav>

        <footer className="home-footer">
          <Clock3 size={11} /> Liga Fictícia 2026 · Horário de Brasília (UTC−3)
        </footer>
      </section>
    </main>
  );
}

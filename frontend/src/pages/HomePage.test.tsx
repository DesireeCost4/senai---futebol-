import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { describe, expect, it } from 'vitest';
import HomePage from './HomePage';

describe('HomePage', () => {
  it('renderiza a entrada da liga e os links dos módulos', () => {
    const markup = renderToStaticMarkup(
      <StaticRouter location="/">
        <HomePage />
      </StaticRouter>,
    );

    expect(markup).toContain('Gestão da liga, do mercado à classificação');
    expect(markup).toContain('Iniciar');
    expect(markup).toContain('href="/clubs"');
    expect(markup).toContain('href="/matches"');
  });
});

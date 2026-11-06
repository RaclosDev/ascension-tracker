import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderInlineMarkdown } from './inlineMarkdown';

describe('renderInlineMarkdown', () => {
  it('renders bold and italic as elements', () => {
    const { container } = render(<p>{renderInlineMarkdown('Come **150 g** de *arroz* hoy')}</p>);
    expect(container.querySelector('strong')?.textContent).toBe('150 g');
    expect(container.querySelector('em')?.textContent).toBe('arroz');
    expect(container.textContent).toBe('Come 150 g de arroz hoy');
  });

  it('keeps HTML from the model as plain text', () => {
    const { container } = render(
      <p>{renderInlineMarkdown('<img src=x onerror=alert(1)> **<b>hola</b>**')}</p>,
    );
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('b')).toBeNull();
    expect(container.textContent).toBe('<img src=x onerror=alert(1)> <b>hola</b>');
  });
});

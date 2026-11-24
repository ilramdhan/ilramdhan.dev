import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { MediaFrame, SpecRow, TileHeading } from '@/components/tile';
import { Marquee } from './Marquee';

// The motion layer only enhances: the server/no-JS markup must be complete and fully visible.
describe('motion layer static markup', () => {
  it('heading stays plain text, numbers print final, nothing starts hidden', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <TileHeading id="h" title="Plain words" />
        <SpecRow items={[{ value: 42, label: 'Count' }]} />
        <MediaFrame src="/a.webp" alt="" width={4} height={3} parallax={8} interactive />
        <MediaFrame src="/b.webp" alt="" width={4} height={3} interactive />
        <Marquee items={['A', 'B']} label="Names" pauseLabel="Pause" playLabel="Play" />
      </MemoryRouter>,
    );
    expect(html).toContain('<h2 id="h" data-reveal=""');
    expect(html).toContain('>Plain words</h2>');
    expect(html).not.toContain('str-word');
    expect(html.match(/>42</g)).toHaveLength(2); // sr-only final + visible layer
    expect(html).not.toMatch(/opacity:\s*0|clip-path/);
    expect(html).not.toContain('data-inset="armed"');
    // Never zoom and parallax on one photo; the clickable frame gets the light.
    expect(html.match(/data-media-interactive/g)).toHaveLength(1);
    expect(html.match(/data-soft-light="photo"/g)).toHaveLength(1);
    // Marquee copies are hidden from AT; the loop is not running yet.
    expect(html).toMatch(/<ul aria-hidden="true" inert="" data-marquee-copy=""/);
    expect(html).not.toContain('data-animated="true"');
  });
});

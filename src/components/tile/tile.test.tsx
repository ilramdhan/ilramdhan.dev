import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Disclosure, DisclosureGroup, SegmentedControl } from './index';

describe('Disclosure', () => {
  it('wires button and region, and toggles with Enter and Space', async () => {
    const onOpenChange = vi.fn();
    render(
      <Disclosure summary="Question" onOpenChange={onOpenChange}>
        <p>Answer</p>
      </Disclosure>,
    );
    const button = screen.getByRole('button', { name: 'Question' });
    expect(button.closest('h3')).not.toBeNull();
    expect(button).toHaveAttribute('aria-expanded', 'false');
    const panel = document.getElementById(button.getAttribute('aria-controls')!)!;
    expect(panel).toHaveAttribute('role', 'region');
    expect(panel).toHaveAttribute('aria-labelledby', button.id);
    // The content is always in the DOM (prerender / SEO), hidden until found while closed.
    expect(screen.getByText('Answer')).toBeInTheDocument();
    await waitFor(() =>
      expect(panel.querySelector('[data-disclosure-clip]')).toHaveAttribute(
        'hidden',
        'until-found',
      ),
    );

    await userEvent.tab();
    expect(button).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(panel).toHaveAttribute('data-open');
    expect(panel.querySelector('[data-disclosure-clip]')).not.toHaveAttribute('hidden');
    await userEvent.keyboard(' ');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
  });

  it('keeps one row open per group', async () => {
    render(
      <DisclosureGroup defaultOpenId="a">
        <Disclosure id="a" summary="A">
          a
        </Disclosure>
        <Disclosure id="b" summary="B">
          b
        </Disclosure>
      </DisclosureGroup>,
    );
    const a = screen.getByRole('button', { name: 'A' });
    const b = screen.getByRole('button', { name: 'B' });
    expect(a).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(b);
    expect(b).toHaveAttribute('aria-expanded', 'true');
    expect(a).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(b);
    expect(b).toHaveAttribute('aria-expanded', 'false');
  });
});

function Segmented({ onChange }: { onChange: (v: string) => void }) {
  const [value, setValue] = useState<'all' | 'web' | 'mobile'>('all');
  return (
    <SegmentedControl
      label="Filter"
      value={value}
      onChange={(v) => {
        onChange(v);
        setValue(v);
      }}
      options={[
        { value: 'all', label: 'All' },
        { value: 'web', label: 'Web' },
        { value: 'mobile', label: 'Mobile' },
      ]}
    />
  );
}

describe('SegmentedControl', () => {
  it('moves focus with the arrow keys, wrapping, and Home/End', async () => {
    render(<Segmented onChange={() => {}} />);
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Web' })).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('button', { name: 'Mobile' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'All' })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('button', { name: 'Mobile' })).toHaveFocus();
  });

  it('is a named group of pressed-state buttons reachable by keyboard', async () => {
    const onChange = vi.fn();
    render(<Segmented onChange={onChange} />);
    expect(screen.getByRole('group', { name: 'Filter' })).toBeInTheDocument();
    const all = screen.getByRole('button', { name: 'All' });
    const web = screen.getByRole('button', { name: 'Web' });
    expect(all).toHaveAttribute('aria-pressed', 'true');
    expect(web).toHaveAttribute('aria-pressed', 'false');

    await userEvent.tab();
    expect(all).toHaveFocus();
    await userEvent.tab();
    expect(web).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('web');
    expect(web).toHaveAttribute('aria-pressed', 'true');
    expect(all).toHaveAttribute('aria-pressed', 'false');

    await userEvent.tab();
    await userEvent.keyboard(' ');
    expect(screen.getByRole('button', { name: 'Mobile' })).toHaveAttribute('aria-pressed', 'true');
    // The thumb follows the chosen segment and stays out of the accessibility tree.
    const thumb = document.querySelector('[data-segmented-thumb]');
    expect(thumb).toHaveAttribute('aria-hidden', 'true');
    expect(thumb).toHaveStyle({ transform: 'translateX(200%)' });
  });
});

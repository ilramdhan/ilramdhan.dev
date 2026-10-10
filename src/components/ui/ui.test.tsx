import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from './Pagination';
import { Dialog } from './Dialog';
import { Field } from './Field';
import { SocialLinks } from './SocialLinks';
import { ErrorState } from './PageState';
import { TechBadge } from './TechBadge';

describe('Pagination', () => {
  it('renders nothing for a single page', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('disables prev on first page and next on last page', () => {
    const { rerender } = render(
      <Pagination currentPage={1} totalPages={3} onPageChange={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();
    rerender(<Pagination currentPage={3} totalPages={3} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('marks the current page and reports changes', async () => {
    const onChange = vi.fn();
    render(<Pagination currentPage={2} totalPages={3} onPageChange={onChange} />);
    expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page');
    await userEvent.click(screen.getByRole('button', { name: '3' }));
    await userEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(onChange).toHaveBeenNthCalledWith(1, 3);
    expect(onChange).toHaveBeenNthCalledWith(2, 1);
  });

  it('collapses long ranges with ellipses', () => {
    render(<Pagination currentPage={10} totalPages={20} onPageChange={vi.fn()} />);
    expect(screen.getAllByText('…')).toHaveLength(2);
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '20' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '5' })).toBeNull();
  });
});

function Harness({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>open</button>
      <Dialog
        open={open}
        title="Demo"
        onClose={() => {
          onClose();
          setOpen(false);
        }}
      >
        <button>first</button>
        <button>last</button>
      </Dialog>
    </>
  );
}

describe('Dialog', () => {
  it('focuses inside, traps Tab, closes on Escape and restores focus', async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    const opener = screen.getByRole('button', { name: 'open' });
    await userEvent.click(opener);
    expect(screen.getByRole('dialog', { name: 'Demo' })).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: 'first' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'last' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'first' })).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'last' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(opener).toHaveFocus();
  });
});

describe('Field', () => {
  it('wires label, description and error to the control', () => {
    render(
      <Field label="Email" description="We never share it" error="Required">
        <input />
      </Field>,
    );
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('We never share it Required');
  });

  it('omits aria attributes when valid', () => {
    render(
      <Field label="Name">
        <input />
      </Field>,
    );
    const input = screen.getByLabelText('Name');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-describedby');
  });
});

describe('SocialLinks', () => {
  it('renders known platforms (incl. whatsapp/steam) and skips unknown or empty', () => {
    const { container } = render(
      <SocialLinks
        links={{
          github: 'github.com/a',
          mail: 'a@b.c',
          whatsapp: 'wa.me/1',
          steam: 'x.com/s',
          foo: 'x',
          twitter: '',
        }}
        containerClassName="c"
        linkClassName="l"
        iconClassName="i"
      />,
    );
    const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toHaveLength(4);
    expect(hrefs).toContain('mailto:a@b.c');
  });

  it('renders an empty container for null links', () => {
    const { container } = render(
      <SocialLinks links={null} containerClassName="c" linkClassName="l" iconClassName="i" />,
    );
    expect(container.querySelector('a')).toBeNull();
  });
});

describe('ErrorState / TechBadge', () => {
  it('calls retry', async () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry}>Boom</ErrorState>);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('uses the provided icon or falls back to Simple Icons', () => {
    const { rerender } = render(<TechBadge name="Node JS" iconUrl="/n.svg" />);
    expect(screen.getByRole('img', { name: 'Node JS' })).toHaveAttribute('src', '/n.svg');
    rerender(<TechBadge name="Node JS" iconUrl={null} />);
    expect(screen.getByRole('img', { name: 'Node JS' })).toHaveAttribute(
      'src',
      expect.stringContaining('/nodejs/'),
    );
  });
});

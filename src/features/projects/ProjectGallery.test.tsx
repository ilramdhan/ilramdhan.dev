import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ProjectGallery } from './ProjectGallery';

const IMAGES = ['/a.webp', '/b.webp', '/c.webp'];

async function openAt(index: number) {
  render(<ProjectGallery images={IMAGES} alt="Screenshot of Demo" />);
  const thumb = screen.getByRole('button', { name: `Open image ${index} of 3 full screen` });
  await userEvent.click(thumb);
  const dialog = await screen.findByRole('dialog', { name: 'Image viewer' });
  return { thumb, dialog };
}

/** jsdom has no PointerEvent: fire a plain event carrying the coordinates. */
function pointer(el: Element, type: 'pointerdown' | 'pointerup', clientX: number, clientY: number) {
  const event = new Event(type, { bubbles: true });
  Object.assign(event, { clientX, clientY });
  fireEvent(el, event);
}

const shown = () => screen.getByRole('dialog').querySelector('img')!.getAttribute('alt');

describe('ProjectGallery lightbox', () => {
  it('renders one thumbnail button per image and no dialog until opened', () => {
    render(<ProjectGallery images={IMAGES} alt="Screenshot of Demo" />);
    expect(screen.getAllByRole('button', { name: /full screen$/ })).toHaveLength(3);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens at the clicked image as a labelled modal with "n / N" and alt text', async () => {
    const { dialog } = await openAt(2);
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveTextContent('2 / 3');
    expect(shown()).toBe('Screenshot of Demo: image 2 of 3');
    expect(dialog.querySelector('img')).toHaveAttribute('src', '/b.webp');
    expect(dialog.querySelector('img')).toHaveClass('object-contain');
    expect(screen.getByText('Screenshot of Demo: image 2 of 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close image viewer' })).toHaveFocus();
    expect(document.documentElement.style.overflow).toBe('hidden');
  });

  it('navigates with arrow keys and buttons, wrapping around', async () => {
    const { dialog } = await openAt(1);
    await userEvent.keyboard('{ArrowRight}');
    expect(dialog).toHaveTextContent('2 / 3');
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(dialog).toHaveTextContent('3 / 3');
    expect(shown()).toBe('Screenshot of Demo: image 3 of 3');
    await userEvent.click(screen.getByRole('button', { name: 'Next image' }));
    expect(dialog).toHaveTextContent('1 / 3');
    await userEvent.click(screen.getByRole('button', { name: 'Previous image' }));
    expect(dialog).toHaveTextContent('3 / 3');
  });

  it('changes the image on a horizontal swipe', async () => {
    const { dialog } = await openAt(1);
    const area = dialog.querySelector('img')!.parentElement!;
    pointer(area, 'pointerdown', 300, 100);
    pointer(area, 'pointerup', 100, 110);
    expect(dialog).toHaveTextContent('2 / 3');
    pointer(area, 'pointerdown', 100, 100);
    pointer(area, 'pointerup', 300, 100);
    expect(dialog).toHaveTextContent('1 / 3');
    // Mostly vertical: a scroll, not a swipe.
    pointer(area, 'pointerdown', 100, 100);
    pointer(area, 'pointerup', 160, 300);
    expect(dialog).toHaveTextContent('1 / 3');
  });

  it('closes on Escape, unlocks scrolling and returns focus to the thumbnail', async () => {
    const { thumb } = await openAt(3);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(thumb).toHaveFocus();
    expect(document.documentElement.style.overflow).toBe('');
  });
});

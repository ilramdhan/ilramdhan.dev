import { Component, createElement, createRef, type HTMLAttributes, type ReactNode } from 'react';
import type { FlipState } from './flip-engine';
import { MOTION_OK, whenNear } from './near';

type Engine = typeof import('./flip-engine');
let engine: Engine | null = null;
let loading: Promise<void> | null = null;
const load = () =>
  (loading ??= import('./flip-engine')
    .then((m) => {
      engine = m;
    })
    .catch(() => {
      loading = null;
    }));
const allowed = () => !!window.matchMedia?.(MOTION_OK).matches;

type Props = {
  as?: 'ul' | 'ol' | 'div';
  /** Changes whenever the set or order of items changes (e.g. the filter query string). */
  flipKey: string;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, 'children'>;

/**
 * GSAP Flip for lists whose items change (mutugading `flip-group.tsx`; projects/blog filters). Mark each item with a
 * stable `data-flip-id`. Right before React commits new children (getSnapshotBeforeUpdate) the old boxes are recorded;
 * after the commit kept items glide to their new place and new ones rise in. The engine loads when the group nears the
 * viewport; reduced motion, no JS or an engine not loaded yet = the plain instant update. `data-flip-runs` counts
 * played flips (QA hook). A class component because only getSnapshotBeforeUpdate runs before the DOM changes.
 */
export class FlipGroup extends Component<Props> {
  private ref = createRef<HTMLElement>();
  private stop: (() => void) | null = null;

  override componentDidMount() {
    const el = this.ref.current;
    if (!el || !allowed()) return;
    this.stop = whenNear(el, () => void load());
  }

  override componentWillUnmount() {
    this.stop?.();
  }

  private items(): Element[] {
    return Array.from(this.ref.current?.querySelectorAll('[data-flip-id]') ?? []);
  }

  override getSnapshotBeforeUpdate(prev: Props): FlipState | null {
    if (prev.flipKey === this.props.flipKey || !engine || !allowed()) return null;
    const items = this.items();
    return items.length ? engine.captureFlip(items) : null;
  }

  override componentDidUpdate(_: Props, __: unknown, state: FlipState | null) {
    const el = this.ref.current;
    if (!state || !engine || !el) return;
    el.dataset.flipping = 'true';
    el.dataset.flipRuns = String(Number(el.dataset.flipRuns ?? 0) + 1);
    engine.playFlip(state, this.items(), () => {
      delete el.dataset.flipping;
    });
  }

  override render() {
    const { as = 'ul', children, flipKey: _flipKey, ...rest } = this.props;
    void _flipKey;
    return createElement(as, { ...rest, ref: this.ref, 'data-flip': '' }, children);
  }
}

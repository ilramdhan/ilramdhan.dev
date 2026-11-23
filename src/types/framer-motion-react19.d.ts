// ponytail: framer-motion 10 types reference `ReactHTML`/`DetailedHTMLFactory`, removed in @types/react 19.
// Restores just those two (props typed as AllHTMLAttributes, slightly looser than before) so `motion.*`
// props type-check. Delete together with framer-motion (R9).
import 'react';

declare module 'react' {
  interface DetailedHTMLFactory<P, T> {
    (props?: P | null): T;
  }
  type ReactHTML = {
    [K in keyof HTMLElementTagNameMap]: DetailedHTMLFactory<
      AllHTMLAttributes<HTMLElementTagNameMap[K]>,
      HTMLElementTagNameMap[K]
    >;
  };
}

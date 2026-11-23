import { Link as RouterLink, type LinkProps } from 'react-router';
import { localePath } from './locale';
import { useLocale } from './index';

/** react-router `Link` that keeps the visitor in the active locale (`/blog` -> `/id/blog`). */
export function Link({ to, ...props }: LinkProps) {
  const locale = useLocale();
  // Object targets (`{ hash }`) are relative to the current page, already localized.
  return <RouterLink to={typeof to === 'string' ? localePath(to, locale) : to} {...props} />;
}

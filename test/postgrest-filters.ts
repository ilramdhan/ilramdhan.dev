/**
 * Minimal model of how PostgREST parses `or=(…)` ilike filters and how Postgres
 * evaluates ILIKE. Shared by the unit tests and the e2e Supabase mock so both
 * reject/accept the same filters as the real backend.
 *
 * Grammar (PostgREST `pLogicSingleVal`): a value is either a double-quoted string
 * (backslash escapes any character) followed by `,` or `)`, or any run of
 * characters other than `,` and `)`.
 */

export interface IlikeClause {
  column: string;
  pattern: string;
}

export class FilterParseError extends Error {}

/** Parses `(col.ilike.value,col.ilike.value)` (outer parens optional). Throws on malformed input. */
export function parseOrIlike(input: string): IlikeClause[] {
  const src = input.startsWith('(') ? input : `(${input})`;
  let i = 1;
  const clauses: IlikeClause[] = [];
  for (;;) {
    const head = /^(\w+)\.ilike\./.exec(src.slice(i));
    if (!head) throw new FilterParseError(`expected "column.ilike." at ${i} in ${src}`);
    i += head[0].length;
    let pattern = '';
    if (src[i] === '"') {
      i++;
      while (i < src.length && src[i] !== '"') {
        if (src[i] === '\\') i++;
        if (i >= src.length) throw new FilterParseError('unterminated escape');
        pattern += src[i++];
      }
      if (src[i] !== '"') throw new FilterParseError('unterminated quoted value');
      i++;
    } else {
      while (i < src.length && src[i] !== ',' && src[i] !== ')') pattern += src[i++];
    }
    clauses.push({ column: head[1] ?? '', pattern });
    if (src[i] === ',') {
      i++;
      continue;
    }
    if (src[i] === ')' && i === src.length - 1) return clauses;
    throw new FilterParseError(`unexpected "${src.slice(i)}" in ${src}`);
  }
}

/**
 * ILIKE pattern → RegExp. PostgREST first maps `*` to `%`; then `%` = any run,
 * `_` = any single character, `\x` = literal x.
 */
export function likeToRegExp(pattern: string): RegExp {
  let re = '';
  const p = pattern.replace(/\*/g, '%');
  for (let i = 0; i < p.length; i++) {
    const c = p[i] ?? '';
    if (c === '\\' && i + 1 < p.length) {
      re += (p[++i] ?? '').replace(/[.*+?^${}()|[\]\\/-]/g, '\\$&');
    } else if (c === '%') re += '[\\s\\S]*';
    else if (c === '_') re += '[\\s\\S]';
    else re += c.replace(/[.*+?^${}()|[\]\\/-]/g, '\\$&');
  }
  return new RegExp(`^${re}$`, 'i');
}

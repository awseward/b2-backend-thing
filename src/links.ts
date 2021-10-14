import { Method } from 'axios';

export interface Link {
  rel: string;
  href: string;
  method: Method;
}

export type Links<Rel extends string> = Record<Rel, Link>;

export interface HasLinks<Rel extends string> {
  _links: Links<Rel>;
}

type SansRels<Rel extends string> = Record<Rel, Pick<Link, 'href'|'method'>>

export function mkLinks<Rel extends string>(partialLinks: SansRels<Rel>): Links<Rel> {
  const rels = Object.keys(partialLinks) as Array<keyof SansRels<Rel>>;

  return rels.reduce<Partial<Links<Rel>>>(
    (links, rel) => {
      links[rel] = { rel, ...partialLinks[rel] };
      return links;
    },
    {}
  ) as Links<Rel>;
}

export function hasLinks<Rel extends string,>(links: SansRels<Rel>): HasLinks<Rel> {
  return { _links: mkLinks(links) };
}
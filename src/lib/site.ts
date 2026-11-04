/** Brand constants shared across the site. */
export const SITE = {
  name: "Pincer",
  domain: "usepincer.org",
  url: "https://usepincer.org",
  xHandle: "@usepincer",
  xUrl: "https://x.com/usepincer",
  githubUrl: "https://github.com/usepincer",
  docsUrl: "https://docs.usepincer.org",
  contactEmail: "hello@usepincer.org",
  securityEmail: "security@usepincer.org",
  appHref: "/console",
  portfolioHref: "/portfolio",
  explorerHref: "/explorer",
} as const;

export const NAV_LINKS = [
  { label: "The process", href: "/#how-it-works" },
  { label: "Platform", href: "/#products" },
  { label: "Rules", href: "/#rules" },
  { label: "Trading", href: "/#liquidity" },
  { label: "Build", href: "/#developers" },
  { label: "Explorer", href: SITE.explorerHref },
] as const;

/** Pages of the documentation, as served at docs.usepincer.org. */
export const DOCS_LINKS = [
  { label: "Introducing Pincer", path: "" },
  { label: "Why companies choose Pincer", path: "overview/why-pincer" },
  { label: "Deploy your company", path: "guides/deploy-your-company" },
  { label: "Liquidity Windows in depth", path: "liquidity/liquidity-windows" },
  { label: "Quickstart", path: "developers/quickstart" },
  { label: "HTTP API reference", path: "developers/api-reference" },
  { label: "Contract reference", path: "developers/contracts" },
  { label: "FAQ", path: "resources/faq" },
] as const;

export function docsHref(path: string): string {
  return path ? `${SITE.docsUrl}/${path}` : SITE.docsUrl;
}

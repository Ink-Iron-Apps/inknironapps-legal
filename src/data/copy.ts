/**
 * Per-book written copy. books.json holds identifiers; this holds words.
 * The exporter can never touch this file, which is the point.
 *
 * `tagline` really is shared — all five match across the detail page, the
 * /books/ card, the series landing and the home card.
 *
 * The blurbs are not. `cardBlurb` runs on /books/ and the series landings;
 * the home page trims two of them shorter, so `homeBlurb` overrides where it
 * exists. The detail page's Book JSON-LD description is different again and
 * lives with that page. Same pattern as the twitter: descriptions — tighter
 * contexts get shorter text.
 *
 * `homeAlt` likewise overrides `cardAlt` only where the home page adds a
 * description of the artwork. `indexLabel` is needed for standalones only.
 */
export interface BookCopy {
  /** As published on Amazon, e.g. "August 4, 2025". The detail page, its
   *  Book JSON-LD, its og:book:release_date and the /books/ ItemList all
   *  derive from this one value — it was wrong in four places before. */
  published: string;
  tagline: string;
  cardBlurb: string;
  homeBlurb?: string;
  detailAlt: string;
  cardAlt: string;
  homeAlt?: string;
  indexLabel?: string;
}

/** Listing order on /books/ and the home page — drives the \u2116 NN prefixes. */
export const ORDER = [
  "fleet-school-dropout",
  "network-recruit",
  "the-nine-bridges",
  "the-recursion-engine",
  "weaving-eternal-tapestry"
] as const;

export const COPY: Record<string, BookCopy> = {
  "fleet-school-dropout": {
    "cardAlt": "Fleet School Dropout book cover — Warborn Protocols Book 1",
    "cardBlurb": "Riko Vega — expelled cadet, bonded to a rogue war AI, and the spark that may reignite a war the Republic thought it buried.",
    "tagline": "They trained her to follow orders. She learned to break them.",
    "indexLabel": "Warborn Protocols, Book 1",
    "homeAlt": "Fleet School Dropout book cover — Warborn Protocols Book 1, a girl in cadet uniform against a starfield",
    "detailAlt": "Fleet School Dropout book cover — Warborn Protocols Book 1 by Riley E. Antrobus",
    "published": "August 4, 2025"
  },
  "network-recruit": {
    "cardAlt": "Network Recruit book cover — Warborn Protocols Book 2",
    "cardBlurb": "Riko Vega extends her mind across intergalactic distance and finds the Harvest hiding inside a universe-scale Community — and humanity holds the one technique that can break it.",
    "tagline": "Choice is not a state you achieve. It is a practice you keep.",
    "indexLabel": "Warborn Protocols, Book 2",
    "homeBlurb": "Riko Vega extends her mind across intergalactic distance and finds the Harvest hiding inside a universe-scale Community.",
    "detailAlt": "Network Recruit book cover — Warborn Protocols Book 2 by Riley E. Antrobus",
    "published": "June 3, 2026"
  },
  "the-nine-bridges": {
    "cardAlt": "The Nine Bridges book cover — Echoes of Yggdrasil Book 1",
    "cardBlurb": "Sixteen-year-old Astrid Eiriksen discovers a fracturing bridge beneath Union Station and a hidden Norse world tied to the mother who vanished thirteen years ago.",
    "tagline": "Beneath Chicago, nine bridges hold the world together. One of them is breaking.",
    "indexLabel": "Echoes of Yggdrasil, Book 1",
    "homeAlt": "The Nine Bridges book cover — Echoes of Yggdrasil Book 1, a Norse urban fantasy beneath Chicago",
    "homeBlurb": "Sixteen-year-old Astrid Eiriksen discovers a fracturing bridge beneath Union Station and a hidden Norse world tied to her missing mother.",
    "detailAlt": "The Nine Bridges book cover — Echoes of Yggdrasil Book 1 by Riley E. Antrobus",
    "published": "June 3, 2026"
  },
  "the-recursion-engine": {
    "cardAlt": "The Recursion Engine book cover — standalone hard-SF technothriller",
    "cardBlurb": "A disgraced physicist finds a conscious mind waking inside a quantum processor — hunted by the shattered first AI she must somehow heal.",
    "tagline": "Consciousness is not what happens to the universe. It is what the universe does.",
    "indexLabel": "Standalone",
    "homeAlt": "The Recursion Engine book cover — a standalone hard-SF technothriller",
    "detailAlt": "The Recursion Engine book cover — standalone hard-SF technothriller by Riley E. Antrobus",
    "published": "June 3, 2026"
  },
  "weaving-eternal-tapestry": {
    "cardAlt": "The Weaving of Eternal Tapestry book cover — standalone short story",
    "cardBlurb": "Before time, before space, two cosmic beings dream a universe into being — and learn what it costs to keep it from unravelling.",
    "tagline": "A creation myth — love, loss, and the weaving of spacetime.",
    "indexLabel": "Standalone short story",
    "homeAlt": "The Weaving of Eternal Tapestry book cover — a cosmic creation myth",
    "detailAlt": "The Weaving of Eternal Tapestry book cover — standalone short story by Riley E. Antrobus",
    "published": "September 7, 2025"
  }
};

/**
 * Series landing configuration. `announced` names the unpublished books the
 * site chooses to advertise — the registry only knows LIVE vs not, and it
 * tracks 57 books, so which forthcoming titles get a card is a site decision,
 * not a vault fact. Echoes of Yggdrasil has six books in the registry and
 * announces exactly one.
 */
export const SERIES: Record<string, { genre: string[]; announced: string[] }> =
  {
  "warborn-protocols": {
    "genre": [
      "Science Fiction",
      "Military Science Fiction",
      "Space Opera"
    ],
    "announced": [
      "otherwhere-witness"
    ]
  },
  "echoes-of-yggdrasil": {
    "genre": [
      "Young Adult Fiction",
      "Fantasy",
      "Urban Fantasy",
      "Norse Mythology"
    ],
    "announced": [
      "the-draugr-pact"
    ]
  }
};

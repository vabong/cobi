declare module 'astro:content' {
	interface RenderResult {
		Content: import('astro/runtime/server/index.js').AstroComponentFactory;
		headings: import('astro').MarkdownHeading[];
		remarkPluginFrontmatter: Record<string, any>;
	}
	interface Render {
		'.md': Promise<RenderResult>;
	}

	export interface RenderedContent {
		html: string;
		metadata?: {
			imagePaths: Array<string>;
			[key: string]: unknown;
		};
	}
}

declare module 'astro:content' {
	type Flatten<T> = T extends { [K: string]: infer U } ? U : never;

	export type CollectionKey = keyof AnyEntryMap;
	export type CollectionEntry<C extends CollectionKey> = Flatten<AnyEntryMap[C]>;

	export type ContentCollectionKey = keyof ContentEntryMap;
	export type DataCollectionKey = keyof DataEntryMap;

	type AllValuesOf<T> = T extends any ? T[keyof T] : never;
	type ValidContentEntrySlug<C extends keyof ContentEntryMap> = AllValuesOf<
		ContentEntryMap[C]
	>['slug'];

	/** @deprecated Use `getEntry` instead. */
	export function getEntryBySlug<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		// Note that this has to accept a regular string too, for SSR
		entrySlug: E,
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;

	/** @deprecated Use `getEntry` instead. */
	export function getDataEntryById<C extends keyof DataEntryMap, E extends keyof DataEntryMap[C]>(
		collection: C,
		entryId: E,
	): Promise<CollectionEntry<C>>;

	export function getCollection<C extends keyof AnyEntryMap, E extends CollectionEntry<C>>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => entry is E,
	): Promise<E[]>;
	export function getCollection<C extends keyof AnyEntryMap>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => unknown,
	): Promise<CollectionEntry<C>[]>;

	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(entry: {
		collection: C;
		slug: E;
	}): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(entry: {
		collection: C;
		id: E;
	}): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		slug: E,
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(
		collection: C,
		id: E,
	): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;

	/** Resolve an array of entry references from the same collection */
	export function getEntries<C extends keyof ContentEntryMap>(
		entries: {
			collection: C;
			slug: ValidContentEntrySlug<C>;
		}[],
	): Promise<CollectionEntry<C>[]>;
	export function getEntries<C extends keyof DataEntryMap>(
		entries: {
			collection: C;
			id: keyof DataEntryMap[C];
		}[],
	): Promise<CollectionEntry<C>[]>;

	export function render<C extends keyof AnyEntryMap>(
		entry: AnyEntryMap[C][string],
	): Promise<RenderResult>;

	export function reference<C extends keyof AnyEntryMap>(
		collection: C,
	): import('astro/zod').ZodEffects<
		import('astro/zod').ZodString,
		C extends keyof ContentEntryMap
			? {
					collection: C;
					slug: ValidContentEntrySlug<C>;
				}
			: {
					collection: C;
					id: keyof DataEntryMap[C];
				}
	>;
	// Allow generic `string` to avoid excessive type errors in the config
	// if `dev` is not running to update as you edit.
	// Invalid collection names will be caught at build time.
	export function reference<C extends string>(
		collection: C,
	): import('astro/zod').ZodEffects<import('astro/zod').ZodString, never>;

	type ReturnTypeOrOriginal<T> = T extends (...args: any[]) => infer R ? R : T;
	type InferEntrySchema<C extends keyof AnyEntryMap> = import('astro/zod').infer<
		ReturnTypeOrOriginal<Required<ContentConfig['collections'][C]>['schema']>
	>;

	type ContentEntryMap = {
		"blog": {
"20190101acoustic-atlas/index.md": {
	id: "20190101acoustic-atlas/index.md";
  slug: "20190101acoustic-atlas";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"acoustic-atlas/index.md": {
	id: "acoustic-atlas/index.md";
  slug: "acoustic-atlas";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"animalism-sound-installation-for-roger-ballen/index.md": {
	id: "animalism-sound-installation-for-roger-ballen/index.md";
  slug: "animalism-sound-installation-for-roger-ballen";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"binaural-recordings-with-claudia-graziadei-s-singing-workshops-at-ocean-space-san-lorenzo-venice/index.md": {
	id: "binaural-recordings-with-claudia-graziadei-s-singing-workshops-at-ocean-space-san-lorenzo-venice/index.md";
  slug: "binaural-recordings-with-claudia-graziadei-s-singing-workshops-at-ocean-space-san-lorenzo-venice";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"cerbero-fiera-crudele-e-diversa/index.md": {
	id: "cerbero-fiera-crudele-e-diversa/index.md";
  slug: "cerbero-fiera-crudele-e-diversa";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"echoes-reflections/index.md": {
	id: "echoes-reflections/index.md";
  slug: "echoes-reflections";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"field-recordings-and-impulse-response-recordings-in-the-yorkshire-dales/index.md": {
	id: "field-recordings-and-impulse-response-recordings-in-the-yorkshire-dales/index.md";
  slug: "field-recordings-and-impulse-response-recordings-in-the-yorkshire-dales";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"geiger-september-fest-atlante/index.md": {
	id: "geiger-september-fest-atlante/index.md";
  slug: "geiger-september-fest-atlante";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"impulse-responses-and-auralization/index.md": {
	id: "impulse-responses-and-auralization/index.md";
  slug: "impulse-responses-and-auralization";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"many-locations-added-to-acoustic-atlas/index.md": {
	id: "many-locations-added-to-acoustic-atlas/index.md";
  slug: "many-locations-added-to-acoustic-atlas";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"microtonal-collection-on-bandcamp/index.md": {
	id: "microtonal-collection-on-bandcamp/index.md";
  slug: "microtonal-collection-on-bandcamp";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"music-for-trees-kunsthalle-wilhelmshaven/index.md": {
	id: "music-for-trees-kunsthalle-wilhelmshaven/index.md";
  slug: "music-for-trees-kunsthalle-wilhelmshaven";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"mutation-ii-released-on-alternate-african-reality/index.md": {
	id: "mutation-ii-released-on-alternate-african-reality/index.md";
  slug: "mutation-ii-released-on-alternate-african-reality";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"nice-mention-in-yorkshire-post/index.md": {
	id: "nice-mention-in-yorkshire-post/index.md";
  slug: "nice-mention-in-yorkshire-post";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"skatesonic-isea-ideo-villa-montalvo/index.md": {
	id: "skatesonic-isea-ideo-villa-montalvo/index.md";
  slug: "skatesonic-isea-ideo-villa-montalvo";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"snow-now-on-bandcamp/index.md": {
	id: "snow-now-on-bandcamp/index.md";
  slug: "snow-now-on-bandcamp";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"tetrarchs-artist-residency-in-al-ain-uae/index.md": {
	id: "tetrarchs-artist-residency-in-al-ain-uae/index.md";
  slug: "tetrarchs-artist-residency-in-al-ain-uae";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"venice-a-thousand-echoes-chiesa-di-santo-stefano/index.md": {
	id: "venice-a-thousand-echoes-chiesa-di-santo-stefano/index.md";
  slug: "venice-a-thousand-echoes-chiesa-di-santo-stefano";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"venice-aparitions-sound-installation-for-roger-ballen/index.md": {
	id: "venice-aparitions-sound-installation-for-roger-ballen/index.md";
  slug: "venice-aparitions-sound-installation-for-roger-ballen";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"vertical-time/index.md": {
	id: "vertical-time/index.md";
  slug: "vertical-time";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
};

	};

	type DataEntryMap = {
		
	};

	type AnyEntryMap = ContentEntryMap & DataEntryMap;

	export type ContentConfig = typeof import("../../src/content/config.js");
}

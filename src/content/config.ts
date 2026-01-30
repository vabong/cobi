import { z, defineCollection } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z
    .object({
      title: z.string(),

      // New field (preferred)
      publishDate: z.coerce.string().optional(),

      // Legacy field (accept during migration)
      date: z.coerce.string().optional(),

      cover: z.string().optional(),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
    })
    .transform((data) => {
      // Prefer publishDate, fallback to legacy date
      const publishDate = data.publishDate ?? data.date;

      if (!publishDate) {
        // Keep this strict so you notice missing dates
        throw new Error(`Missing publishDate/date for blog post: "${data.title}"`);
      }

      return {
        ...data,
        publishDate, // normalized string
      };
    }),
});

export const collections = { blog };

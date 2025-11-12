import { defineCollection, z } from "astro:content";

// Define your blog content collection
const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    pubDate: z.date().optional(),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),

  // 👇 Default layout for all blog posts
  entryLayout: "../../layouts/BlogPostLayout.astro",
});

export const collections = { blog };

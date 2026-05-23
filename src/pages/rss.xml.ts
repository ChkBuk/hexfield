import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '~/config/site';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return rss({
    title: `${SITE.name} — Insights & Advice`,
    description: 'IT, cloud and cybersecurity insights for Australian businesses.',
    site: context.site ?? SITE.url,
    items: posts
      .sort((a, b) => b.data.publishedDate.getTime() - a.data.publishedDate.getTime())
      .map((post) => ({
        title: post.data.title,
        description: post.data.description,
        link: `/blog/${post.slug}/`,
        pubDate: post.data.publishedDate,
        author: post.data.author,
        categories: post.data.tags,
      })),
    customData: `<language>en-au</language>`,
    stylesheet: false,
  });
}

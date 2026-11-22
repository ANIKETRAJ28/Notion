import type { Page, PageTree } from '../types/page.types';

export function buildPageTree(pages: Page[]): PageTree[] {
  const pageMap = new Map<string, PageTree>();

  pages.forEach((page) => {
    pageMap.set(page.id, {
      ...page,
      children: [],
    });
  });

  const rootPages: PageTree[] = [];

  pageMap.forEach((page) => {
    if (page.parent_page_id) {
      const parent = pageMap.get(page.parent_page_id);

      if (parent) {
        parent.children.push(page);
      } else {
        rootPages.push(page);
      }
    } else {
      rootPages.push(page);
    }
  });

  return rootPages;
}

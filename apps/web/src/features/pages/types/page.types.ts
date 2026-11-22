export interface Page {
  id: string;
  workspace_id: string;
  parent_page_id: string | null;
  created_by: string;
  title: string;
  icon: string | null;
  cover_url: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePageInput {
  workspace_id: string;
  parent_page_id?: string | null;
  created_by: string;
  title: string;
  icon?: string | null;
  cover_url?: string | null;
}

export interface UpdatePageInput {
  parent_page_id?: string | null;
  title?: string;
  icon?: string | null;
  cover_url?: string | null;
}

export interface PageTree extends Page {
  children: PageTree[];
}

export interface GetWorkspacePagesResponse {
  success: boolean;
  message: string;
  data: {
    pages: Page[];
  };
}

export interface PageResponse {
  success: boolean;
  message: string;
  data: {
    page: Page;
  };
}

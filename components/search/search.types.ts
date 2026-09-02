export const WORKSPACE_SEARCH_SELECT_EVENT = "workspace-search-select";
export const WORKSPACE_SEARCH_CLEAR_EVENT = "workspace-search-clear";

export type SearchResultType = "TASK" | "NOTE";

export type SearchResult = {
  id: string;
  type: SearchResultType;
  title: string;
  snippet: string;
  date: string;
  meta: string;
  matchedField: "TITLE" | "CONTENT";
};

export type SearchSelection = Pick<SearchResult, "id" | "type" | "date"> & {
  query: string;
};

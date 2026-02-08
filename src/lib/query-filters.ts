// src/lib/query-filters.ts
// Reusable query filters for soft delete compliance

export const activeUserFilter = {
  deletedAt: null
};

export const activeProfileFilter = {
  deletedAt: null
};

export const activeContributorFilter = {
  user: {
    deletedAt: null
  }
};

export const activeSplitSheetFilter = {
  createdBy: {
    deletedAt: null
  }
};

// Helper function to apply soft delete filtering to any query
export function withActiveUserFilter<T extends Record<string, any>>(baseQuery: T): T {
  return {
    ...baseQuery,
    where: {
      ...baseQuery.where,
      deletedAt: null
    }
  } as T;
}
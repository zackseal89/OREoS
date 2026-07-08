/**
 * Central query-key factory for TanStack Query. Every list is scoped by
 * workspaceId so switching workspaces (SessionContext.setActiveWorkspace)
 * never shows stale cross-tenant data.
 */
export const queryKeys = {
  brands: (workspaceId: string) => ["brands", workspaceId] as const,
  products: (workspaceId: string) => ["products", workspaceId] as const,
  product: (productId: string) => ["product", productId] as const,
  campaigns: (workspaceId: string) => ["campaigns", workspaceId] as const,
  campaign: (campaignId: string) => ["campaign", campaignId] as const,
  campaignIdeas: (campaignId: string) => ["campaignIdeas", campaignId] as const,
  assets: (workspaceId: string) => ["assets", workspaceId] as const,
  campaignAssets: (campaignId: string) => ["campaignAssets", campaignId] as const,
  generationJobs: (workspaceId: string) => ["generationJobs", workspaceId] as const,
  notifications: (workspaceId: string) => ["notifications", workspaceId] as const,
};

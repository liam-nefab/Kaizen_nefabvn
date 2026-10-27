export interface ApiConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  siteId: string;
  listName: string;
  driveName: string;
}

export function getConfig(): ApiConfig {
  return {
    tenantId: process.env.AZURE_TENANT_ID || '',
    clientId: process.env.AZURE_CLIENT_ID || '',
    clientSecret: process.env.AZURE_CLIENT_SECRET || '',
    siteId: process.env.SP_SITE_ID || '',
    listName: process.env.SP_LIST_NAME || 'KaizenIdeas',
    driveName: process.env.SP_DRIVE_NAME || 'KaizenImages',
  };
}

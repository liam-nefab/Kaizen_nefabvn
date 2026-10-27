import { HttpRequest } from '@azure/functions';

export interface ClientPrincipal {
  identityProvider: string;
  userId: string;
  userDetails: string;
  userRoles: string[];
}

/**
 * Giải mã header x-ms-client-principal do Azure Static Web Apps tự động chèn
 */
export function getClientPrincipal(request: HttpRequest): ClientPrincipal | null {
  const header = request.headers.get('x-ms-client-principal');
  if (!header) {
    return null;
  }

  try {
    const decoded = Buffer.from(header, 'base64').toString('utf-8');
    return JSON.parse(decoded) as ClientPrincipal;
  } catch {
    return null;
  }
}

/**
 * Kiểm tra người dùng có quyền Reviewer hoặc Admin không
 */
export function isAuthorizedReviewer(principal: ClientPrincipal | null): boolean {
  if (!principal) return false;
  return (
    principal.userRoles.includes('reviewer') ||
    principal.userRoles.includes('admin')
  );
}

/**
 * Kiểm tra quyền Quản trị viên (Admin)
 */
export function isAuthorizedAdmin(principal: ClientPrincipal | null): boolean {
  if (!principal) return false;
  return principal.userRoles.includes('admin');
}

import { IKaizenApiClient } from './types';
import { MockApiClient } from './mockApiClient';
import { HttpApiClient } from './httpApiClient';

// Mặc định bật Mock trong môi trường preview AI Studio, hoặc khi VITE_USE_MOCK !== 'false'
const useMock = import.meta.env.VITE_USE_MOCK !== 'false';

export const mockClientInstance = new MockApiClient();
export const httpClientInstance = new HttpApiClient();

export const apiClient: IKaizenApiClient = useMock ? mockClientInstance : httpClientInstance;

export const isMockMode = useMock;
export * from './types';

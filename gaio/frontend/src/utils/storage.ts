import { AuthResponse, EstimativaRequest, EstimativaResponse, LocalEstimateUiState } from '../types';

const AUTH_KEY = 'gaio_auth';
const LOCAL_ESTIMATES_KEY = 'gaio_estimates_local';
const PENDING_ESTIMATE_KEY = 'gaio_pending_estimate';

export interface PendingEstimateSave {
  request: EstimativaRequest;
  result: EstimativaResponse;
  uiState: LocalEstimateUiState;
}

export const authStorage = {
  save(data: AuthResponse): void {
    localStorage.setItem(AUTH_KEY, JSON.stringify(data));
  },
  get(): AuthResponse | null {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthResponse;
    } catch {
      return null;
    }
  },
  clear(): void {
    localStorage.removeItem(AUTH_KEY);
  }
};

export interface LocalEstimateItem {
  id: string;
  createdAt: string;
  bairroOuCep: string;
  valorEstimado: number;
}

export const localEstimateStorage = {
  list(): LocalEstimateItem[] {
    const raw = localStorage.getItem(LOCAL_ESTIMATES_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as LocalEstimateItem[];
    } catch {
      return [];
    }
  },
  add(item: LocalEstimateItem): void {
    const items = this.list();
    localStorage.setItem(LOCAL_ESTIMATES_KEY, JSON.stringify([item, ...items].slice(0, 20)));
  }
};

export const pendingEstimateStorage = {
  set(data: PendingEstimateSave): void {
    localStorage.setItem(PENDING_ESTIMATE_KEY, JSON.stringify(data));
  },
  get(): PendingEstimateSave | null {
    const raw = localStorage.getItem(PENDING_ESTIMATE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PendingEstimateSave;
    } catch {
      return null;
    }
  },
  clear(): void {
    localStorage.removeItem(PENDING_ESTIMATE_KEY);
  }
};

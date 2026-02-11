import {
  Parish, CreateParishRequest, UpdateParishRequest,
  Member, CreateMemberRequest, UpdateMemberRequest,
  SacramentRecord, CreateSacramentRequest, UpdateSacramentRequest,
  IncomeTransaction, CreateIncomeRequest,
  ExpenseVoucher, CreateExpenseRequest,
  DashboardStats,
  UUID,
  LoginRequest,
  AuthResponse,
  User,
  Budget,
  CreateBudgetRequest,
  UpdateBudgetRequest,
  TrialBalance,
  IncomeExpenditureStatement,
  ImportResponse
} from '../types';

const API_BASE_URL = 'http://localhost:3000';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // Auth
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('POST', '/auth/login', data);
    if (response.token) {
      localStorage.setItem('sanctus_token', response.token);
      localStorage.setItem('sanctus_user', JSON.stringify(response.user));
    }
    return response;
  }

  logout() {
    localStorage.removeItem('sanctus_token');
    localStorage.removeItem('sanctus_user');
  }

  getToken(): string | null {
    return localStorage.getItem('sanctus_token');
  }

  getUser(): User | null {
    const userStr = localStorage.getItem('sanctus_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  private async request<T>(method: string, endpoint: string, body?: any): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('GET', '/dashboard');
  }

  // Parishes
  async listParishes(): Promise<Parish[]> {
    return this.request<Parish[]>('GET', '/parishes');
  }

  async getParish(id: UUID): Promise<Parish> {
    return this.request<Parish>('GET', `/parishes/${id}`);
  }

  async createParish(data: CreateParishRequest): Promise<Parish> {
    return this.request<Parish>('POST', '/parishes', data);
  }

  async updateParish(id: UUID, data: UpdateParishRequest): Promise<Parish> {
    return this.request<Parish>('PUT', `/parishes/${id}`, data);
  }

  async deleteParish(id: UUID): Promise<void> {
    return this.request<void>('DELETE', `/parishes/${id}`);
  }

  // Members
  async listMembers(parishId?: UUID): Promise<Member[]> {
    const query = parishId ? `?parish_id=${parishId}` : '';
    return this.request<Member[]>('GET', `/members${query}`);
  }

  async getMember(id: UUID): Promise<Member> {
    return this.request<Member>('GET', `/members/${id}`);
  }

  async createMember(data: CreateMemberRequest): Promise<Member> {
    return this.request<Member>('POST', '/members', data);
  }

  async updateMember(id: UUID, data: UpdateMemberRequest): Promise<Member> {
    return this.request<Member>('PUT', `/members/${id}`, data);
  }

  async deleteMember(id: UUID): Promise<void> {
    return this.request<void>('DELETE', `/members/${id}`);
  }

  // Sacraments
  async listSacraments(memberId?: UUID, parishId?: UUID): Promise<SacramentRecord[]> {
    let query = '';
    if (memberId) query = `?member_id=${memberId}`;
    else if (parishId) query = `?parish_id=${parishId}`;

    return this.request<SacramentRecord[]>('GET', `/sacraments${query}`);
  }

  async getSacrament(id: UUID): Promise<SacramentRecord> {
    return this.request<SacramentRecord>('GET', `/sacraments/${id}`);
  }

  async createSacrament(data: CreateSacramentRequest): Promise<SacramentRecord> {
    return this.request<SacramentRecord>('POST', '/sacraments', data);
  }

  async updateSacrament(id: UUID, data: UpdateSacramentRequest): Promise<SacramentRecord> {
    return this.request<SacramentRecord>('PUT', `/sacraments/${id}`, data);
  }

  async deleteSacrament(id: UUID): Promise<void> {
    return this.request<void>('DELETE', `/sacraments/${id}`);
  }

  // Transactions
  async listIncomeTransactions(parishId?: UUID): Promise<IncomeTransaction[]> {
    const query = parishId ? `?parish_id=${parishId}` : '';
    return this.request<IncomeTransaction[]>('GET', `/transactions/income${query}`);
  }

  async getIncomeTransaction(id: UUID): Promise<IncomeTransaction> {
    return this.request<IncomeTransaction>('GET', `/transactions/income/${id}`);
  }

  async createIncomeTransaction(data: CreateIncomeRequest): Promise<IncomeTransaction> {
    return this.request<IncomeTransaction>('POST', '/transactions/income', data);
  }

  async listExpenseVouchers(parishId?: UUID): Promise<ExpenseVoucher[]> {
    const query = parishId ? `?parish_id=${parishId}` : '';
    return this.request<ExpenseVoucher[]>('GET', `/transactions/expense${query}`);
  }

  async getExpenseVoucher(id: UUID): Promise<ExpenseVoucher> {
    return this.request<ExpenseVoucher>('GET', `/transactions/expense/${id}`);
  }

  async createExpenseVoucher(data: CreateExpenseRequest): Promise<ExpenseVoucher> {
    return this.request<ExpenseVoucher>('POST', '/transactions/expense', data);
  }

  // Users
  async listUsers(): Promise<User[]> {
    return this.request<User[]>('GET', '/users');
  }

  async createUser(data: any): Promise<User> {
    return this.request<User>('POST', '/users', data);
  }

  async deleteUser(id: UUID): Promise<void> {
    return this.request<void>('DELETE', `/users/${id}`);
  }

  // Budgets
  async listBudgets(parishId: UUID, fiscalYear?: number): Promise<Budget[]> {
    const query = `?parish_id=${parishId}${fiscalYear ? `&fiscal_year=${fiscalYear}` : ''}`;
    return this.request<Budget[]>('GET', `/budgets${query}`);
  }

  async createBudget(data: CreateBudgetRequest): Promise<Budget> {
    return this.request<Budget>('POST', '/budgets', data);
  }

  async updateBudget(id: UUID, data: UpdateBudgetRequest): Promise<Budget> {
    return this.request<Budget>('PUT', `/budgets/${id}`, data);
  }

  // Reports
  async getTrialBalance(parishId: UUID, startDate: string, endDate: string): Promise<TrialBalance> {
    const query = `?parish_id=${parishId}&start_date=${startDate}&end_date=${endDate}`;
    return this.request<TrialBalance>('GET', `/reports/trial-balance${query}`);
  }

  async getIncomeExpenditure(parishId: UUID, startDate: string, endDate: string): Promise<IncomeExpenditureStatement> {
    const query = `?parish_id=${parishId}&start_date=${startDate}&end_date=${endDate}`;
    return this.request<IncomeExpenditureStatement>('GET', `/reports/income-expenditure${query}`);
  }

  // Import
  async importMembers(file: File, parishId?: UUID): Promise<ImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (parishId) {
      formData.append('parish_id', parishId);
    }
    return this.requestMultipart<ImportResponse>('POST', '/import/members', formData);
  }

  async importTransactions(file: File, parishId?: UUID): Promise<ImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (parishId) {
      formData.append('parish_id', parishId);
    }
    return this.requestMultipart<ImportResponse>('POST', '/import/transactions', formData);
  }

  private async requestMultipart<T>(method: string, endpoint: string, body: FormData): Promise<T> {
    const headers: Record<string, string> = {};

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers,
      body,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }
}

export const api = new ApiClient(API_BASE_URL);

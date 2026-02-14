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
  ImportResponse,
  Diocese,
  Cluster, CreateClusterRequest, UpdateClusterRequest,
  Scc, CreateSccRequest, UpdateSccRequest,
  Family, CreateFamilyRequest, UpdateFamilyRequest,
  Permission, RoleWithPermissions, CustomRole, CreateRoleRequest, UpdateRoleRequest,
  UserPermissionOverride, GrantUserOverrideRequest, RevokeUserOverrideRequest,
} from '../types';

const API_BASE_URL = 'http://localhost:3000';

export class ApiClient {
  private baseUrl: string;
  private onUnauthorized?: () => void;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setOnUnauthorized(callback: () => void) {
    this.onUnauthorized = callback;
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
      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        this.logout();
        if (this.onUnauthorized) {
          this.onUnauthorized();
        }
      }
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

  // Dioceses
  async listDioceses(): Promise<Diocese[]> {
    return this.request<Diocese[]>('GET', '/dioceses');
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

  async getBudgetVsActual(parishId: UUID, startDate: string, endDate: string): Promise<any> {
    const query = `?parish_id=${parishId}&start_date=${startDate}&end_date=${endDate}`;
    return this.request<any>('GET', `/reports/budget-vs-actual${query}`);
  }

  async getBalanceSheet(parishId: UUID, startDate: string, endDate: string): Promise<any> {
    const query = `?parish_id=${parishId}&start_date=${startDate}&end_date=${endDate}`;
    return this.request<any>('GET', `/reports/balance-sheet${query}`);
  }

  async getCashFlow(parishId: UUID, startDate: string, endDate: string): Promise<any> {
    const query = `?parish_id=${parishId}&start_date=${startDate}&end_date=${endDate}`;
    return this.request<any>('GET', `/reports/cash-flow${query}`);
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

  async importClusters(file: File, parishId: UUID): Promise<ImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('parish_id', parishId);
    return this.requestMultipart<ImportResponse>('POST', '/import/clusters', formData);
  }

  async importSccs(file: File, parishId: UUID): Promise<ImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('parish_id', parishId);
    return this.requestMultipart<ImportResponse>('POST', '/import/sccs', formData);
  }

  async importFamilies(file: File, parishId: UUID): Promise<ImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('parish_id', parishId);
    return this.requestMultipart<ImportResponse>('POST', '/import/families', formData);
  }

  // Settings
  async listSettings(parishId?: UUID, group?: string): Promise<any[]> {
    let query = '';
    const params: string[] = [];
    if (parishId) params.push(`parish_id=${parishId}`);
    if (group) params.push(`setting_group=${group}`);
    if (params.length) query = '?' + params.join('&');
    return this.request<any[]>('GET', `/settings${query}`);
  }

  async upsertSetting(data: { parish_id?: UUID; setting_key: string; setting_value: string; setting_group?: string; description?: string }): Promise<any> {
    return this.request<any>('POST', '/settings', data);
  }

  async bulkUpsertSettings(settings: { parish_id?: UUID; setting_key: string; setting_value: string; setting_group?: string; description?: string }[]): Promise<any[]> {
    return this.request<any[]>('POST', '/settings/bulk', { settings });
  }

  // Clusters
  async listClusters(parishId?: UUID): Promise<Cluster[]> {
    const query = parishId ? `?parish_id=${parishId}` : '';
    return this.request<Cluster[]>('GET', `/clusters${query}`);
  }

  async getCluster(id: UUID): Promise<Cluster> {
    return this.request<Cluster>('GET', `/clusters/${id}`);
  }

  async createCluster(data: CreateClusterRequest): Promise<Cluster> {
    return this.request<Cluster>('POST', '/clusters', data);
  }

  async updateCluster(id: UUID, data: UpdateClusterRequest): Promise<Cluster> {
    return this.request<Cluster>('PUT', `/clusters/${id}`, data);
  }

  async deleteCluster(id: UUID): Promise<void> {
    return this.request<void>('DELETE', `/clusters/${id}`);
  }

  // SCCs
  async listSccs(parishId?: UUID, clusterId?: UUID): Promise<Scc[]> {
    let query = '';
    if (clusterId) query = `?cluster_id=${clusterId}`;
    else if (parishId) query = `?parish_id=${parishId}`;
    return this.request<Scc[]>('GET', `/sccs${query}`);
  }

  async getScc(id: UUID): Promise<Scc> {
    return this.request<Scc>('GET', `/sccs/${id}`);
  }

  async createScc(data: CreateSccRequest): Promise<Scc> {
    return this.request<Scc>('POST', '/sccs', data);
  }

  async updateScc(id: UUID, data: UpdateSccRequest): Promise<Scc> {
    return this.request<Scc>('PUT', `/sccs/${id}`, data);
  }

  async deleteScc(id: UUID): Promise<void> {
    return this.request<void>('DELETE', `/sccs/${id}`);
  }

  // Families
  async listFamilies(parishId?: UUID, sccId?: UUID): Promise<Family[]> {
    let query = '';
    if (sccId) query = `?scc_id=${sccId}`;
    else if (parishId) query = `?parish_id=${parishId}`;
    return this.request<Family[]>('GET', `/families${query}`);
  }

  async getFamily(id: UUID): Promise<Family> {
    return this.request<Family>('GET', `/families/${id}`);
  }

  async createFamily(data: CreateFamilyRequest): Promise<Family> {
    return this.request<Family>('POST', '/families', data);
  }

  async updateFamily(id: UUID, data: UpdateFamilyRequest): Promise<Family> {
    return this.request<Family>('PUT', `/families/${id}`, data);
  }

  async deleteFamily(id: UUID): Promise<void> {
    return this.request<void>('DELETE', `/families/${id}`);
  }

  // Members with Holy Orders (for priest selection)
  async listOrdainedMembers(): Promise<Member[]> {
    return this.request<Member[]>('GET', '/members');
  }

  // Permissions
  async listPermissions(group?: string): Promise<Permission[]> {
    const query = group ? `?group=${group}` : '';
    return this.request<Permission[]>('GET', `/permissions${query}`);
  }

  // Roles
  async listRoles(): Promise<RoleWithPermissions[]> {
    return this.request<RoleWithPermissions[]>('GET', '/roles');
  }

  async getRole(id: UUID): Promise<RoleWithPermissions> {
    return this.request<RoleWithPermissions>('GET', `/roles/${id}`);
  }

  async createRole(data: CreateRoleRequest): Promise<CustomRole> {
    return this.request<CustomRole>('POST', '/roles', data);
  }

  async updateRole(id: UUID, data: UpdateRoleRequest): Promise<CustomRole> {
    return this.request<CustomRole>('PUT', `/roles/${id}`, data);
  }

  async deleteRole(id: UUID): Promise<void> {
    return this.request<void>('DELETE', `/roles/${id}`);
  }

  async setRolePermissions(roleId: UUID, permissionIds: UUID[]): Promise<Permission[]> {
    return this.request<Permission[]>('PUT', `/roles/${roleId}/permissions`, { permission_ids: permissionIds });
  }

  // User Permission Overrides
  async listUserOverrides(userId?: UUID): Promise<UserPermissionOverride[]> {
    const query = userId ? `?user_id=${userId}` : '';
    return this.request<UserPermissionOverride[]>('GET', `/user-overrides${query}`);
  }

  async grantUserOverrides(data: GrantUserOverrideRequest): Promise<UserPermissionOverride[]> {
    return this.request<UserPermissionOverride[]>('POST', '/user-overrides', data);
  }

  async revokeUserOverrides(data: RevokeUserOverrideRequest): Promise<void> {
    return this.request<void>('POST', '/user-overrides/revoke', data);
  }

  async revokeSingleOverride(id: UUID): Promise<void> {
    return this.request<void>('DELETE', `/user-overrides/${id}`);
  }

  // Audit Logs
  async listAuditLogs(params?: { parish_id?: UUID; user_id?: UUID; action_type?: string; table_name?: string; limit?: number; offset?: number }): Promise<any[]> {
    const p: string[] = [];
    if (params?.parish_id) p.push(`parish_id=${params.parish_id}`);
    if (params?.user_id) p.push(`user_id=${params.user_id}`);
    if (params?.action_type) p.push(`action_type=${params.action_type}`);
    if (params?.table_name) p.push(`table_name=${params.table_name}`);
    if (params?.limit) p.push(`limit=${params.limit}`);
    if (params?.offset) p.push(`offset=${params.offset}`);
    const query = p.length ? '?' + p.join('&') : '';
    return this.request<any[]>('GET', `/audit-logs${query}`);
  }

  // File Uploads
  async uploadParishLogo(parishId: UUID, file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.requestMultipart<{ url: string }>('POST', `/upload/parish/${parishId}/logo`, formData);
  }

  async uploadMemberPhoto(memberId: UUID, file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.requestMultipart<{ url: string }>('POST', `/upload/member/${memberId}/photo`, formData);
  }

  async uploadUserPhoto(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.requestMultipart<{ url: string }>('POST', '/upload/user/photo', formData);
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

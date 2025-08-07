import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Device, ApiResponse } from '../types/device';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
      timeout: 10000,
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async getPendingDevices(): Promise<Device[]> {
    const response: AxiosResponse<ApiResponse<{ devices: Device[] }>> = 
      await this.api.get('/devices/pending');
    return response.data.data?.devices || [];
  }

  async approveDevice(deviceId: string): Promise<void> {
    await this.api.put(`/devices/${deviceId}/approve`);
  }

  async rejectDevice(deviceId: string, reason: string): Promise<void> {
    await this.api.put(`/devices/${deviceId}/reject`, { reason });
  }

  async getDeviceStatus(hardwareId: string): Promise<{
    status: string;
    deviceId?: string;
    sqsQueueUrl?: string;
  }> {
    const response: AxiosResponse<ApiResponse<{
      status: string;
      deviceId?: string;
      sqsQueueUrl?: string;
    }>> = await this.api.get(`/devices/status/${hardwareId}`);
    return response.data.data!;
  }

  // Mock login for demo purposes
  async login(email: string, password: string): Promise<string> {
    // In a real app, this would call your auth endpoint
    if (email === 'admin@example.com' && password === 'admin123') {
      const mockToken = 'mock-jwt-token-' + Date.now();
      localStorage.setItem('authToken', mockToken);
      return mockToken;
    }
    throw new Error('Invalid credentials');
  }

  logout(): void {
    localStorage.removeItem('authToken');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }
}

export const apiService = new ApiService();
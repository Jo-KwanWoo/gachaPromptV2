import React, { useState, useEffect } from 'react';
import { RefreshCw, Search, Filter } from 'lucide-react';
import { Device, DeviceStatus } from '../types/device';
import { DeviceCard } from '../components/DeviceCard';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

export const DeviceManagement: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | 'all'>('all');

  const fetchDevices = async () => {
    setIsLoading(true);
    try {
      const pendingDevices = await apiService.getPendingDevices();
      setDevices(pendingDevices);
    } catch (error) {
      toast.error('장치 목록을 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    let filtered = devices;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(device =>
        device.hardwareId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.ipAddress.includes(searchTerm) ||
        device.tenantId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(device => device.status === statusFilter);
    }

    setFilteredDevices(filtered);
  }, [devices, searchTerm, statusFilter]);

  const handleDeviceUpdate = () => {
    fetchDevices();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">로딩 중...</span>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            장치 관리
          </h3>
          <button
            onClick={fetchDevices}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="하드웨어 ID, IP 주소, 테넌트 ID로 검색..."
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as DeviceStatus | 'all')}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="all">모든 상태</option>
                <option value={DeviceStatus.PENDING}>승인 대기</option>
                <option value={DeviceStatus.APPROVED}>승인됨</option>
                <option value={DeviceStatus.REJECTED}>거부됨</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-3 text-sm text-gray-600">
          총 {filteredDevices.length}개의 장치
          {searchTerm && ` (검색: "${searchTerm}")`}
          {statusFilter !== 'all' && ` (상태: ${
            statusFilter === DeviceStatus.PENDING ? '승인 대기' :
            statusFilter === DeviceStatus.APPROVED ? '승인됨' : '거부됨'
          })`}
        </div>
      </div>

      {/* Device List */}
      <div className="mt-6">
        {filteredDevices.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">
              {searchTerm || statusFilter !== 'all' 
                ? '검색 조건에 맞는 장치가 없습니다' 
                : '등록된 장치가 없습니다'
              }
            </div>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all'
                ? '다른 검색 조건을 시도해보세요'
                : '새로운 장치 등록을 기다리고 있습니다'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDevices.map((device) => (
              <DeviceCard
                key={device.hardwareId}
                device={device}
                onDeviceUpdate={handleDeviceUpdate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
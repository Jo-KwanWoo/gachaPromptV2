import React, { useState, useEffect } from 'react';
import { Monitor, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Device, DeviceStatus } from '../types/device';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

export const Dashboard: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDevices = async () => {
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
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDevices, 30000);
    return () => clearInterval(interval);
  }, []);

  const stats = {
    total: devices.length,
    pending: devices.filter(d => d.status === DeviceStatus.PENDING).length,
    approved: devices.filter(d => d.status === DeviceStatus.APPROVED).length,
    rejected: devices.filter(d => d.status === DeviceStatus.REJECTED).length,
  };

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, icon, color }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`p-3 rounded-md ${color}`}>
              {icon}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                {value}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

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
      <div className="border-b border-gray-200 pb-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            대시보드
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

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="전체 장치"
          value={stats.total}
          icon={<Monitor className="h-6 w-6 text-white" />}
          color="bg-primary-500"
        />
        <StatCard
          title="승인 대기"
          value={stats.pending}
          icon={<Clock className="h-6 w-6 text-white" />}
          color="bg-warning-500"
        />
        <StatCard
          title="승인됨"
          value={stats.approved}
          icon={<CheckCircle className="h-6 w-6 text-white" />}
          color="bg-success-500"
        />
        <StatCard
          title="거부됨"
          value={stats.rejected}
          icon={<XCircle className="h-6 w-6 text-white" />}
          color="bg-danger-500"
        />
      </div>

      {/* Recent Devices */}
      <div className="mt-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              최근 등록 요청
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              최근에 등록 요청된 장치들입니다.
            </p>
          </div>
          
          {devices.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Monitor className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                등록 요청이 없습니다
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                새로운 장치 등록 요청을 기다리고 있습니다.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {devices.slice(0, 5).map((device) => (
                <li key={device.hardwareId} className="px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Monitor className="h-8 w-8 text-gray-400" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {device.hardwareId}
                        </p>
                        <p className="text-sm text-gray-500">
                          {device.ipAddress} • {device.systemInfo.os}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        device.status === DeviceStatus.PENDING
                          ? 'bg-warning-50 text-warning-600'
                          : device.status === DeviceStatus.APPROVED
                          ? 'bg-success-50 text-success-600'
                          : 'bg-danger-50 text-danger-600'
                      }`}>
                        {device.status === DeviceStatus.PENDING && '승인 대기'}
                        {device.status === DeviceStatus.APPROVED && '승인됨'}
                        {device.status === DeviceStatus.REJECTED && '거부됨'}
                      </span>
                      <span className="ml-3 text-sm text-gray-500">
                        {new Date(device.createdAt).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
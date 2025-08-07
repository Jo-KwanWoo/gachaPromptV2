import React, { useState } from 'react';
import { Device, DeviceStatus } from '../types/device';
import { Check, X, Clock, Monitor, MapPin, Info } from 'lucide-react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

interface DeviceCardProps {
  device: Device;
  onDeviceUpdate: () => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({ device, onDeviceUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      await apiService.approveDevice(device.hardwareId);
      toast.success('장치가 승인되었습니다');
      onDeviceUpdate();
    } catch (error) {
      toast.error('장치 승인에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('거부 사유를 입력해주세요');
      return;
    }

    setIsLoading(true);
    try {
      await apiService.rejectDevice(device.hardwareId, rejectReason);
      toast.success('장치가 거부되었습니다');
      setShowRejectModal(false);
      setRejectReason('');
      onDeviceUpdate();
    } catch (error) {
      toast.error('장치 거부에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: DeviceStatus) => {
    switch (status) {
      case DeviceStatus.PENDING:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-50 text-warning-600">
            <Clock className="w-3 h-3 mr-1" />
            승인 대기
          </span>
        );
      case DeviceStatus.APPROVED:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-50 text-success-600">
            <Check className="w-3 h-3 mr-1" />
            승인됨
          </span>
        );
      case DeviceStatus.REJECTED:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger-50 text-danger-600">
            <X className="w-3 h-3 mr-1" />
            거부됨
          </span>
        );
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <Monitor className="h-8 w-8 text-gray-400" />
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">
                {device.hardwareId}
              </h3>
              <p className="text-sm text-gray-500">테넌트: {device.tenantId}</p>
            </div>
          </div>
          {getStatusBadge(device.status)}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            IP: {device.ipAddress}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Info className="h-4 w-4 mr-2" />
            OS: {device.systemInfo.os}
          </div>
        </div>

        <div className="mt-4 bg-gray-50 rounded-md p-3">
          <h4 className="text-sm font-medium text-gray-900 mb-2">시스템 정보</h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div>버전: {device.systemInfo.version}</div>
            <div>아키텍처: {device.systemInfo.architecture}</div>
            <div>메모리: {device.systemInfo.memory}</div>
            <div>저장소: {device.systemInfo.storage}</div>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          등록일: {new Date(device.createdAt).toLocaleString('ko-KR')}
        </div>

        {device.status === DeviceStatus.PENDING && (
          <div className="mt-6 flex space-x-3">
            <button
              onClick={handleApprove}
              disabled={isLoading}
              className="flex-1 bg-success-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-success-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '처리 중...' : '승인'}
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={isLoading}
              className="flex-1 bg-danger-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-danger-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              거부
            </button>
          </div>
        )}

        {device.status === DeviceStatus.REJECTED && device.rejectionReason && (
          <div className="mt-4 p-3 bg-danger-50 border border-danger-200 rounded-md">
            <p className="text-sm text-danger-700">
              <strong>거부 사유:</strong> {device.rejectionReason}
            </p>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              장치 거부
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              장치 "{device.hardwareId}"를 거부하는 이유를 입력해주세요.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="거부 사유를 입력하세요..."
              className="w-full p-3 border border-gray-300 rounded-md resize-none h-24"
              maxLength={500}
            />
            <div className="mt-4 flex space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
              >
                취소
              </button>
              <button
                onClick={handleReject}
                disabled={isLoading || !rejectReason.trim()}
                className="flex-1 bg-danger-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-danger-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '처리 중...' : '거부'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
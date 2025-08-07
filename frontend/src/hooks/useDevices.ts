import { useState, useEffect, useCallback } from 'react';
import { Device } from '../types/device';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

export const useDevices = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const pendingDevices = await apiService.getPendingDevices();
      setDevices(pendingDevices);
    } catch (err: any) {
      const errorMessage = '장치 목록을 불러오는데 실패했습니다';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const approveDevice = useCallback(async (deviceId: string) => {
    try {
      await apiService.approveDevice(deviceId);
      toast.success('장치가 승인되었습니다');
      await fetchDevices(); // Refresh the list
    } catch (err: any) {
      toast.error('장치 승인에 실패했습니다');
      throw err;
    }
  }, [fetchDevices]);

  const rejectDevice = useCallback(async (deviceId: string, reason: string) => {
    try {
      await apiService.rejectDevice(deviceId, reason);
      toast.success('장치가 거부되었습니다');
      await fetchDevices(); // Refresh the list
    } catch (err: any) {
      toast.error('장치 거부에 실패했습니다');
      throw err;
    }
  }, [fetchDevices]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  return {
    devices,
    isLoading,
    error,
    fetchDevices,
    approveDevice,
    rejectDevice
  };
};
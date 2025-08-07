import { DeviceStatus } from '../types/device';

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const formatRelativeTime = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return '방금 전';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}일 전`;
  }

  return formatDate(dateString);
};

export const getStatusText = (status: DeviceStatus): string => {
  switch (status) {
    case DeviceStatus.PENDING:
      return '승인 대기';
    case DeviceStatus.APPROVED:
      return '승인됨';
    case DeviceStatus.REJECTED:
      return '거부됨';
    default:
      return '알 수 없음';
  }
};

export const getStatusColor = (status: DeviceStatus): string => {
  switch (status) {
    case DeviceStatus.PENDING:
      return 'bg-warning-50 text-warning-600';
    case DeviceStatus.APPROVED:
      return 'bg-success-50 text-success-600';
    case DeviceStatus.REJECTED:
      return 'bg-danger-50 text-danger-600';
    default:
      return 'bg-gray-50 text-gray-600';
  }
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
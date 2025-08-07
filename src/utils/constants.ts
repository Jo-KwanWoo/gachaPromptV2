export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
} as const;

export const DEVICE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
} as const;

export const API_MESSAGES = {
  DEVICE_REGISTERED: 'Device registration request submitted successfully',
  DEVICE_APPROVED: 'Device approved successfully',
  DEVICE_REJECTED: 'Device rejected successfully',
  DEVICE_NOT_FOUND: 'Device not found',
  DEVICE_ALREADY_PENDING: 'Device registration is already pending approval',
  DEVICE_ALREADY_APPROVED: 'Device is already registered and approved',
  DEVICE_NOT_PENDING: 'Device is not in pending status',
  INVALID_HARDWARE_ID: 'Invalid hardware ID format',
  REGISTRATION_EXPIRED: 'Device registration has expired. Please register again.',
  DEVICE_READY: 'Device has been approved and is ready for operation',
  DEVICE_PENDING: 'Device registration is pending approval'
} as const;

export const VALIDATION_RULES = {
  HARDWARE_ID: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 64,
    PATTERN: /^[a-zA-Z0-9]+$/
  },
  REJECTION_REASON: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 500
  }
} as const;

export const TIMING = {
  REGISTRATION_RETRY_INTERVAL: 5 * 60 * 1000, // 5 minutes
  STATUS_CHECK_INTERVAL: 5 * 60 * 1000, // 5 minutes
  REGISTRATION_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
  AUTO_REFRESH_INTERVAL: 30 * 1000 // 30 seconds
} as const;
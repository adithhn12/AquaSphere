/**
 * AquaSphere AI - Simulated User Credentials Database
 * 
 * This file contains test accounts for different user roles in the
 * Bengaluru Municipal Water Crisis Management System.
 * 
 * In production, this would be replaced with actual backend authentication.
 */

export type UserRole = 'admin' | 'citizen' | 'driver' | 'guest';

export interface BaseUser {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  lastLogin: string;
  isActive: boolean;
}

export interface AdminUser extends BaseUser {
  role: 'admin';
  adminId: string;
  accessToken: string;
  department: string;
  clearanceLevel: 'L1' | 'L2' | 'L3';
  permissions: string[];
}

export interface CitizenUser extends BaseUser {
  role: 'citizen';
  rrNumber: string; // BWSSB RR Number
  password: string;
  ward: string;
  wardId: string;
  address: string;
  conservationScore: number;
  totalRequests: number;
  leaksReported: number;
}

export interface DriverUser extends BaseUser {
  role: 'driver';
  driverId: string;
  password: string;
  licenseNumber: string;
  tankerId: string;
  tankerPlate: string;
  rating: number;
  totalDeliveries: number;
  totalEarnings: number;
  isOnDuty: boolean;
}

export interface GuestUser extends BaseUser {
  role: 'guest';
  email: string;
  otpVerified: boolean;
  sessionExpiry: string;
  accessLevel: 'readonly';
}

export type User = AdminUser | CitizenUser | DriverUser | GuestUser;

/**
 * Admin Users Database
 * - Uses adminId + accessToken for authentication
 * - Full system control and monitoring capabilities
 */
export const adminUsers: AdminUser[] = [
  {
    id: 'ADM-001',
    role: 'admin',
    adminId: 'ADMIN-001',
    accessToken: 'admin',
    name: 'Rajiv Malhotra',
    email: 'rajiv.malhotra@bwssb.gov.in',
    phone: '+91 98450 12345',
    department: 'Water Distribution Control',
    clearanceLevel: 'L3',
    permissions: [
      'system.full_access',
      'users.manage',
      'tankers.dispatch',
      'tankers.override',
      'reports.view',
      'reports.export',
      'incidents.manage',
      'wards.configure',
      'forecasts.access',
    ],
    createdAt: '2023-01-15T09:00:00Z',
    lastLogin: '2024-01-20T08:30:00Z',
    isActive: true,
  },
  {
    id: 'ADM-002',
    role: 'admin',
    adminId: 'ADMIN-002',
    accessToken: 'supervisor',
    name: 'Priyanka S.',
    email: 'priyanka.s@bwssb.gov.in',
    phone: '+91 98450 67890',
    department: 'Operations Monitoring',
    clearanceLevel: 'L2',
    permissions: [
      'tankers.dispatch',
      'reports.view',
      'incidents.manage',
      'wards.view',
      'forecasts.access',
    ],
    createdAt: '2023-03-20T10:00:00Z',
    lastLogin: '2024-01-19T14:20:00Z',
    isActive: true,
  },
];

export const citizenUsers: CitizenUser[] = [
  {
    id: 'CIT-001',
    role: 'citizen',
    rrNumber: 'W-1234567A',
    password: 'citizen123',
    name: 'Aditi Rao',
    email: 'aditi.rao@gmail.com',
    phone: '+91 99001 23456',
    ward: 'HSR Layout',
    wardId: 'W174',
    address: '123, 14th Main, HSR Layout Sector 2, Bengaluru - 560102',
    conservationScore: 2380,
    totalRequests: 15,
    leaksReported: 5,
    createdAt: '2023-02-10T08:00:00Z',
    lastLogin: '2024-01-20T07:15:00Z',
    isActive: true,
  },
  {
    id: 'CIT-002',
    role: 'citizen',
    rrNumber: 'W-2345678B',
    password: 'water2024',
    name: 'Mohit Sharma',
    email: 'mohit.s@yahoo.com',
    phone: '+91 99002 34567',
    ward: 'Koramangala',
    wardId: 'W161',
    address: '45, 4th Block, Koramangala, Bengaluru - 560034',
    conservationScore: 1850,
    totalRequests: 8,
    leaksReported: 3,
    createdAt: '2023-04-15T09:30:00Z',
    lastLogin: '2024-01-19T18:40:00Z',
    isActive: true,
  },
];

export const driverUsers: DriverUser[] = [
  {
    id: 'DRV-001',
    role: 'driver',
    driverId: 'DRV-2026-987',
    password: 'driver',
    name: 'Devraj Singh',
    email: 'devraj.s@aquaflow.in',
    phone: '+91 98765 43210',
    licenseNumber: 'KA-01-2018-0045678',
    tankerId: 'TNK-218',
    tankerPlate: 'KA-01-MQ-4421',
    rating: 4.8,
    totalDeliveries: 1247,
    totalEarnings: 285000,
    isOnDuty: true,
    createdAt: '2022-06-15T08:00:00Z',
    lastLogin: '2024-01-20T05:30:00Z',
    isActive: true,
  },
  {
    id: 'DRV-002',
    role: 'driver',
    driverId: 'DRV-2026-445',
    password: 'tanker445',
    name: 'Sunil Kumar',
    email: 'sunil.k@aquaflow.in',
    phone: '+91 98765 43211',
    licenseNumber: 'KA-03-2019-0067890',
    tankerId: 'TNK-307',
    tankerPlate: 'KA-03-AB-7891',
    rating: 4.6,
    totalDeliveries: 982,
    totalEarnings: 224500,
    isOnDuty: true,
    createdAt: '2022-09-20T09:00:00Z',
    lastLogin: '2024-01-20T06:00:00Z',
    isActive: true,
  },
];

/**
 * Guest Users Database
 * - Uses email + OTP for authentication (simulated)
 * - Read-only access to public data
 */
export const guestUsers: GuestUser[] = [
  {
    id: 'GST-001',
    role: 'guest',
    name: 'Guest User',
    email: 'guest@demo.com',
    phone: '',
    otpVerified: true,
    sessionExpiry: '2024-01-20T23:59:59Z',
    accessLevel: 'readonly',
    createdAt: '2024-01-20T10:00:00Z',
    lastLogin: '2024-01-20T10:00:00Z',
    isActive: true,
  },
];

/**
 * Combined users database
 */
export const allUsers: User[] = [
  ...adminUsers,
  ...citizenUsers,
  ...driverUsers,
  ...guestUsers,
];

/**
 * Authentication Functions
 */

export interface AuthResult {
  success: boolean;
  user: User | null;
  error: string | null;
  sessionToken: string | null;
}

/**
 * Authenticate Admin User
 */
export function authenticateAdmin(adminId: string, accessToken: string): AuthResult {
  const user = adminUsers.find(
    u => u.adminId.toLowerCase() === adminId.toLowerCase() && 
         u.accessToken === accessToken &&
         u.isActive
  );

  if (user) {
    return {
      success: true,
      user,
      error: null,
      sessionToken: `session_admin_${user.id}_${Date.now()}`,
    };
  }

  return {
    success: false,
    user: null,
    error: 'Invalid Admin ID or Access Token. This action has been logged.',
    sessionToken: null,
  };
}

/**
 * Authenticate Citizen User
 */
export function authenticateCitizen(rrNumber: string, password: string): AuthResult {
  const user = citizenUsers.find(
    u => u.rrNumber.toLowerCase() === rrNumber.toLowerCase() && 
         u.password === password &&
         u.isActive
  );

  if (user) {
    return {
      success: true,
      user,
      error: null,
      sessionToken: `session_citizen_${user.id}_${Date.now()}`,
    };
  }

  // Check if RR number exists but password is wrong
  const rrExists = citizenUsers.find(
    u => u.rrNumber.toLowerCase() === rrNumber.toLowerCase()
  );

  if (rrExists) {
    return {
      success: false,
      user: null,
      error: 'Incorrect password. Please try again.',
      sessionToken: null,
    };
  }

  return {
    success: false,
    user: null,
    error: 'RR Number not found. Please check your water bill for the correct number.',
    sessionToken: null,
  };
}

/**
 * Authenticate Driver User
 */
export function authenticateDriver(driverId: string, password: string): AuthResult {
  const user = driverUsers.find(
    u => u.driverId.toLowerCase() === driverId.toLowerCase() && 
         u.password === password &&
         u.isActive
  );

  if (user) {
    return {
      success: true,
      user,
      error: null,
      sessionToken: `session_driver_${user.id}_${Date.now()}`,
    };
  }

  // Check if driver ID exists but password is wrong
  const driverExists = driverUsers.find(
    u => u.driverId.toLowerCase() === driverId.toLowerCase()
  );

  if (driverExists) {
    return {
      success: false,
      user: null,
      error: 'Incorrect password. Contact your supervisor if you forgot your credentials.',
      sessionToken: null,
    };
  }

  return {
    success: false,
    user: null,
    error: 'Driver ID not registered. Please contact the transport authority.',
    sessionToken: null,
  };
}

/**
 * Authenticate Guest User (via email OTP - simulated)
 */
export function authenticateGuest(email: string): AuthResult {
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      success: false,
      user: null,
      error: 'Please enter a valid email address.',
      sessionToken: null,
    };
  }

  // Create a temporary guest user
  const guestUser: GuestUser = {
    id: `GST-${Date.now()}`,
    role: 'guest',
    name: 'Guest User',
    email: email,
    phone: '',
    otpVerified: true, // Simulated OTP verification
    sessionExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    accessLevel: 'readonly',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    isActive: true,
  };

  return {
    success: true,
    user: guestUser,
    error: null,
    sessionToken: `session_guest_${guestUser.id}_${Date.now()}`,
  };
}

/**
 * Get user by session token
 */
export function getUserBySessionToken(token: string): User | null {
  // In a real app, this would validate the token and return the user
  // For demo purposes, we'll parse the token to get the user ID
  const parts = token.split('_');
  if (parts.length < 3) return null;

  const role = parts[1];
  const userId = parts[2];

  switch (role) {
    case 'admin':
      return adminUsers.find(u => u.id === userId) || null;
    case 'citizen':
      return citizenUsers.find(u => u.id === userId) || null;
    case 'driver':
      return driverUsers.find(u => u.id === userId) || null;
    case 'guest':
      return guestUsers.find(u => u.id === userId) || null;
    default:
      return null;
  }
}

/**
 * Demo credentials for quick access
 */
export const demoCredentials = {
  admin: {
    adminId: 'ADMIN-001',
    accessToken: 'admin',
    description: 'Full system access',
  },
  citizen: {
    rrNumber: 'W-1234567A',
    password: 'citizen123',
    description: 'HSR Layout resident',
  },
  driver: {
    driverId: 'DRV-2026-987',
    password: 'driver',
    description: 'Active tanker driver',
  },
  guest: {
    email: 'guest@demo.com',
    description: 'Public read-only access',
  },
};

import prisma from '../config/database';
import { Request } from 'express';

// Audit Action Types
export enum AuditAction {
  // Employee Management
  EMPLOYEE_CREATED = 'EMPLOYEE_CREATED',
  EMPLOYEE_UPDATED = 'EMPLOYEE_UPDATED',
  EMPLOYEE_DELETED = 'EMPLOYEE_DELETED',
  EMPLOYEE_BULK_IMPORTED = 'EMPLOYEE_BULK_IMPORTED',

  // User Management
  LMS_USER_CREATED = 'LMS_USER_CREATED',
  LMS_USER_UPDATED = 'LMS_USER_UPDATED',
  LMS_USER_DELETED = 'LMS_USER_DELETED',
  LMS_USER_ROLE_CHANGED = 'LMS_USER_ROLE_CHANGED',
  LMS_USER_STATUS_CHANGED = 'LMS_USER_STATUS_CHANGED',
  LMS_USER_PASSWORD_RESET = 'LMS_USER_PASSWORD_RESET',

  // Leave Balance Management
  LEAVE_BALANCE_ALLOCATED = 'LEAVE_BALANCE_ALLOCATED',
  LEAVE_BALANCE_ADJUSTED = 'LEAVE_BALANCE_ADJUSTED',
  LEAVE_BALANCE_BULK_PROCESSED = 'LEAVE_BALANCE_BULK_PROCESSED',

  // Holiday Management
  HOLIDAY_CREATED = 'HOLIDAY_CREATED',
  HOLIDAY_UPDATED = 'HOLIDAY_UPDATED',
  HOLIDAY_DELETED = 'HOLIDAY_DELETED',

  // Leave Request Management
  LEAVE_APPLIED = 'LEAVE_APPLIED',
  LEAVE_UPDATED = 'LEAVE_UPDATED',
  LEAVE_APPROVED = 'LEAVE_APPROVED',
  LEAVE_REJECTED = 'LEAVE_REJECTED',
  LEAVE_CANCELLED = 'LEAVE_CANCELLED',
  LEAVE_BULK_APPROVED = 'LEAVE_BULK_APPROVED',
  LEAVE_BULK_REJECTED = 'LEAVE_BULK_REJECTED',

  // Authentication
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
}

// Audit Entity Types
export enum AuditEntity {
  EMPLOYEE = 'EMPLOYEE',
  USER = 'USER',
  LEAVE_BALANCE = 'LEAVE_BALANCE',
  HOLIDAY = 'HOLIDAY',
  LEAVE_REQUEST = 'LEAVE_REQUEST',
  AUTHENTICATION = 'AUTHENTICATION',
}

interface AuditLogData {
  action: AuditAction;
  description: string;
  entity: AuditEntity;
  entityId: string;
  employeeId?: string;
  oldValues?: any;
  newValues?: any;
  leaveRequestId?: string;
  ipAddress?: string;
  userAgent?: string;
}

class AuditService {
  /**
   * Create an audit log entry
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: data.action,
          description: data.description,
          entity: data.entity,
          entityId: data.entityId,
          employeeId: data.employeeId || null,
          oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
          newValues: data.newValues ? JSON.stringify(data.newValues) : null,
          leaveRequestId: data.leaveRequestId || null,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
        },
      });
    } catch (error) {
      // Don't throw errors from audit logging - just log to console
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Extract IP address and user agent from Express request
   */
  getRequestMetadata(req?: Request): { ipAddress?: string; userAgent?: string } {
    if (!req) {
      return {
        ipAddress: undefined,
        userAgent: undefined,
      };
    }

    // Safely extract IP address
    let ipAddress: string | undefined;
    try {
      ipAddress = (req.ip || req.socket?.remoteAddress || '').replace('::ffff:', '');
    } catch (error) {
      ipAddress = undefined;
    }

    // Safely extract user agent
    let userAgent: string | undefined;
    try {
      userAgent = typeof req.get === 'function' ? req.get('user-agent') : undefined;
    } catch (error) {
      userAgent = undefined;
    }

    return {
      ipAddress,
      userAgent,
    };
  }

  /**
   * Compare old and new values to generate a detailed change description
   * Fields to skip for employee comparison
   */
  private employeeFieldsToSkip = new Set(['id', 'createdAt', 'updatedAt', 'lmsUserCreated']);

  /**
   * Fields to skip for user comparison
   */
  private userFieldsToSkip = new Set(['id', 'createdAt', 'updatedAt', 'password', 'passwordResetToken', 'passwordResetExpires']);

  /**
   * Human-readable field name mapping
   */
  private fieldNameMapping: { [key: string]: string } = {
    firstName: 'First Name',
    lastName: 'Last Name',
    gender: 'Gender',
    email: 'Email',
    phoneNumber: 'Phone Number',
    dateOfJoining: 'Date of Joining',
    exitDate: 'Exit Date',
    location: 'Location',
    designation: 'Designation',
    department: 'Department',
    employmentType: 'Employment Type',
    reportingManager: 'Reporting Manager',
    reportingManagerId: 'Reporting Manager ID',
    lmsAccess: 'LMS Access',
    isActive: 'Active Status',
    role: 'Role',
    region: 'Region',
    managerEmployeeId: 'Manager Employee ID',
  };

  /**
   * Format a value for display in audit description
   */
  private formatValue(value: any): string {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value instanceof Date) return value.toISOString().split('T')[0];
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  /**
   * Generate detailed change description for employee or user updates
   */
  private generateChangeDescription(
    oldData: any,
    newData: any,
    fieldsToSkip: Set<string>
  ): string {
    const changes: string[] = [];

    // Find all changed fields
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

    for (const key of allKeys) {
      // Skip fields we don't want to track
      if (fieldsToSkip.has(key)) continue;

      const oldValue = oldData[key];
      const newValue = newData[key];

      // Check if value changed (handle dates, nulls, etc.)
      const oldStr = this.formatValue(oldValue);
      const newStr = this.formatValue(newValue);

      if (oldStr !== newStr) {
        const fieldName = this.fieldNameMapping[key] || key;
        changes.push(`${fieldName}: ${oldStr} → ${newStr}`);
      }
    }

    return changes.length > 0 ? changes.join(', ') : 'No changes detected';
  }

  // ===========================
  // EMPLOYEE MANAGEMENT AUDITS
  // ===========================

  async logEmployeeCreated(
    employeeId: string,
    employeeData: any,
    performedBy: string,
    req?: Request
  ): Promise<void> {
    await this.log({
      action: AuditAction.EMPLOYEE_CREATED,
      description: `Employee ${employeeId} (${employeeData.firstName} ${employeeData.lastName}) created`,
      entity: AuditEntity.EMPLOYEE,
      entityId: employeeId,
      employeeId: performedBy,
      newValues: employeeData,
      ...this.getRequestMetadata(req),
    });
  }

  async logEmployeeUpdated(
    employeeId: string,
    oldData: any,
    newData: any,
    performedBy: string,
    req?: Request
  ): Promise<void> {
    const changes = this.generateChangeDescription(oldData, newData, this.employeeFieldsToSkip);
    await this.log({
      action: AuditAction.EMPLOYEE_UPDATED,
      description: `Employee ${employeeId} (${newData.firstName} ${newData.lastName}) updated - ${changes}`,
      entity: AuditEntity.EMPLOYEE,
      entityId: employeeId,
      employeeId: performedBy,
      oldValues: oldData,
      newValues: newData,
      ...this.getRequestMetadata(req),
    });
  }

  async logEmployeeDeleted(
    employeeId: string,
    employeeData: any,
    performedBy: string,
    req?: Request
  ): Promise<void> {
    await this.log({
      action: AuditAction.EMPLOYEE_DELETED,
      description: `Employee ${employeeId} (${employeeData.firstName} ${employeeData.lastName}) deleted`,
      entity: AuditEntity.EMPLOYEE,
      entityId: employeeId,
      employeeId: performedBy,
      oldValues: employeeData,
      ...this.getRequestMetadata(req),
    });
  }

  async logEmployeeBulkImported(
    count: number,
    performedBy: string,
    req?: Request
  ): Promise<void> {
    await this.log({
      action: AuditAction.EMPLOYEE_BULK_IMPORTED,
      description: `Bulk imported ${count} employees from Excel file`,
      entity: AuditEntity.EMPLOYEE,
      entityId: 'BULK_IMPORT',
      employeeId: performedBy,
      newValues: { count },
      ...this.getRequestMetadata(req),
    });
  }

  // =========================
  // USER MANAGEMENT AUDITS
  // =========================

  async logLMSUserCreated(
    employeeId: string,
    userData: any,
    performedBy: string,
    req?: Request
  ): Promise<void> {
    await this.log({
      action: AuditAction.LMS_USER_CREATED,
      description: `LMS user created for employee ${employeeId} (${userData.firstName} ${userData.lastName}) with role ${userData.role}`,
      entity: AuditEntity.USER,
      entityId: employeeId,
      employeeId: performedBy,
      newValues: { ...userData, password: '[REDACTED]' },
      ...this.getRequestMetadata(req),
    });
  }

  async logLMSUserUpdated(
    employeeId: string,
    oldData: any,
    newData: any,
    performedBy: string,
    req?: Request
  ): Promise<void> {
    await this.log({
      action: AuditAction.LMS_USER_UPDATED,
      description: `LMS user ${employeeId} (${newData.firstName} ${newData.lastName}) updated`,
      entity: AuditEntity.USER,
      entityId: employeeId,
      employeeId: performedBy,
      oldValues: oldData,
      newValues: newData,
      ...this.getRequestMetadata(req),
    });
  }

  async logLMSUserDeleted(
    employeeId: string,
    userData: any,
    performedBy: string,
    req?: Request
  ): Promise<void> {
    await this.log({
      action: AuditAction.LMS_USER_DELETED,
      description: `LMS user ${employeeId} (${userData.firstName} ${userData.lastName}) deleted`,
      entity: AuditEntity.USER,
      entityId: employeeId,
      employeeId: performedBy,
      oldValues: userData,
      ...this.getRequestMetadata(req),
    });
  }

  async logLMSUserRoleChanged(
    employeeId: string,
    oldRole: string,
    newRole: string,
    performedBy: string,
    req?: Request
  ): Promise<void> {
    await this.log({
      action: AuditAction.LMS_USER_ROLE_CHANGED,
      description: `LMS user ${employeeId} role changed from ${oldRole} to ${newRole}`,
      entity: AuditEntity.USER,
      entityId: employeeId,
      employeeId: performedBy,
      oldValues: { role: oldRole },
      newValues: { role: newRole },
      ...this.getRequestMetadata(req),
    });
  }

  async logLMSUserStatusChanged(
    employeeId: string,
    oldStatus: boolean,
    newStatus: boolean,
    performedBy: string,
    req?: Request
  ): Promise<void> {
    await this.log({
      action: AuditAction.LMS_USER_STATUS_CHANGED,
      description: `LMS user ${employeeId} status changed from ${oldStatus ? 'Active' : 'Inactive'} to ${newStatus ? 'Active' : 'Inactive'}`,
      entity: AuditEntity.USER,
      entityId: employeeId,
      employeeId: performedBy,
      oldValues: { isActive: oldStatus },
      newValues: { isActive: newStatus },
      ...this.getRequestMetadata(req),
    });
  }

  async logLMSUserPasswordReset(
    employeeId: string,
    userName: string,
    performedBy: string,
    req?: Request
  ): Promise<void> {
    await this.log({
      action: AuditAction.LMS_USER_PASSWORD_RESET,
      description: `Password reset for LMS user ${employeeId} (${userName})`,
      entity: AuditEntity.USER,
      entityId: employeeId,
      employeeId: performedBy,
      ...this.getRequestMetadata(req),
    });
  }

  // =============================
  // LEAVE BALANCE MANAGEMENT AUDITS
  // =============================

  async logLeaveBalanceAllocated(
    employeeId: string,
    leaveTypeCode: string,
    year: number,
    days: number,
    performedBy: string,
    req?: Request
  ): Promise<void> {
    await this.log({
      action: AuditAction.LEAVE_BALANCE_ALLOCATED,
      description: `Allocated ${days} days of ${leaveTypeCode} for employee ${employeeId} for year ${year}`,
      entity: AuditEntity.LEAVE_BALANCE,
      entityId: `${employeeId}_${leaveTypeCode}_${year}`,
      employeeId: performedBy,
      newValues: { employeeId, leaveTypeCode, year, days },
      ...this.getRequestMetadata(req),
    });
  }

  async logLeaveBalanceAdjusted(
    employeeId: string,
    leaveTypeCode: string,
    year: number,
    oldBalance: any,
    newBalance: any,
    performedBy: string,
    req?: Request
  ): Promise<void> {
    await this.log({
      action: AuditAction.LEAVE_BALANCE_ADJUSTED,
      description: `Adjusted leave balance for employee ${employeeId}, ${leaveTypeCode} for year ${year}`,
      entity: AuditEntity.LEAVE_BALANCE,
      entityId: `${employeeId}_${leaveTypeCode}_${year}`,
      employeeId: performedBy,
      oldValues: oldBalance,
      newValues: newBalance,
      ...this.getRequestMetadata(req),
    });
  }

  async logLeaveBalanceBulkProcessed(
    region: string,
    employmentType: string,
    leaveTypeCode: string,
    month: number,
    year: number,
    employeesCount: number,
    daysProcessed: number,
    performedBy: string,
    req?: Request
  ): Promise<void> {
    await this.log({
      action: AuditAction.LEAVE_BALANCE_BULK_PROCESSED,
      description: `Bulk processed ${daysProcessed} days of ${leaveTypeCode} for ${employeesCount} employees in ${region} - ${employmentType} for ${month}/${year}`,
      entity: AuditEntity.LEAVE_BALANCE,
      entityId: `BULK_${region}_${employmentType}_${year}_${month}`,
      employeeId: performedBy,
      newValues: { region, employmentType, leaveTypeCode, month, year, employeesCount, daysProcessed },
      ...this.getRequestMetadata(req),
    });
  }

  // =======================
  // HOLIDAY MANAGEMENT AUDITS
  // =======================

  async logHolidayCreated(
    holidayId: string,
    holidayData: any,
    performedBy: string,
    req?: Request
  ): Promise<void> {
    await this.log({
      action: AuditAction.HOLIDAY_CREATED,
      description: `Holiday created: ${holidayData.description} on ${new Date(holidayData.date).toLocaleDateString()} for ${holidayData.location}`,
      entity: AuditEntity.HOLIDAY,
      entityId: holidayId,
      employeeId: performedBy,
      newValues: holidayData,
      ...this.getRequestMetadata(req),
    });
  }

  async logHolidayUpdated(
    holidayId: string,
    oldData: any,
    newData: any,
    performedBy: string,
    req?: Request
  ): Promise<void> {
    await this.log({
      action: AuditAction.HOLIDAY_UPDATED,
      description: `Holiday updated: ${newData.description} on ${new Date(newData.date).toLocaleDateString()} for ${newData.location}`,
      entity: AuditEntity.HOLIDAY,
      entityId: holidayId,
      employeeId: performedBy,
      oldValues: oldData,
      newValues: newData,
      ...this.getRequestMetadata(req),
    });
  }

  async logHolidayDeleted(
    holidayId: string,
    holidayData: any,
    performedBy: string,
    req?: Request
  ): Promise<void> {
    await this.log({
      action: AuditAction.HOLIDAY_DELETED,
      description: `Holiday deleted: ${holidayData.description} on ${new Date(holidayData.date).toLocaleDateString()} for ${holidayData.location}`,
      entity: AuditEntity.HOLIDAY,
      entityId: holidayId,
      employeeId: performedBy,
      oldValues: holidayData,
      ...this.getRequestMetadata(req),
    });
  }

  // ==========================
  // LEAVE REQUEST MANAGEMENT AUDITS
  // ==========================

  async logLeaveApplied(
    leaveRequestId: string,
    leaveData: any,
    employeeId: string,
    req?: Request
  ): Promise<void> {
    await this.log({
      action: AuditAction.LEAVE_APPLIED,
      description: `Leave applied by ${employeeId}: ${leaveData.leaveTypeCode} from ${new Date(leaveData.startDate).toLocaleDateString()} to ${new Date(leaveData.endDate).toLocaleDateString()} (${leaveData.totalDays} days)`,
      entity: AuditEntity.LEAVE_REQUEST,
      entityId: leaveRequestId,
      employeeId: employeeId,
      leaveRequestId: leaveRequestId,
      newValues: leaveData,
      ...this.getRequestMetadata(req),
    });
  }

  async logLeaveUpdated(
    leaveRequestId: string,
    oldData: any,
    newData: any,
    employeeId: string,
    req?: Request
  ): Promise<void> {
    await this.log({
      action: AuditAction.LEAVE_UPDATED,
      description: `Leave request ${leaveRequestId} updated by ${employeeId}`,
      entity: AuditEntity.LEAVE_REQUEST,
      entityId: leaveRequestId,
      employeeId: employeeId,
      leaveRequestId: leaveRequestId,
      oldValues: oldData,
      newValues: newData,
      ...this.getRequestMetadata(req),
    });
  }

  async logLeaveApproved(
    leaveRequestId: string,
    leaveData: any,
    approverEmployeeId: string,
    comments?: string,
    req?: Request
  ): Promise<void> {
    await this.log({
      action: AuditAction.LEAVE_APPROVED,
      description: `Leave request ${leaveRequestId} for employee ${leaveData.employeeId} approved by ${approverEmployeeId}: ${leaveData.leaveTypeCode} (${leaveData.totalDays} days)${comments ? ` - ${comments}` : ''}`,
      entity: AuditEntity.LEAVE_REQUEST,
      entityId: leaveRequestId,
      employeeId: approverEmployeeId,
      leaveRequestId: leaveRequestId,
      newValues: { status: 'APPROVED', approverEmployeeId, comments },
      ...this.getRequestMetadata(req),
    });
  }

  async logLeaveRejected(
    leaveRequestId: string,
    leaveData: any,
    approverEmployeeId: string,
    rejectionReason: string,
    req?: Request
  ): Promise<void> {
    await this.log({
      action: AuditAction.LEAVE_REJECTED,
      description: `Leave request ${leaveRequestId} for employee ${leaveData.employeeId} rejected by ${approverEmployeeId}: ${leaveData.leaveTypeCode} (${leaveData.totalDays} days) - Reason: ${rejectionReason}`,
      entity: AuditEntity.LEAVE_REQUEST,
      entityId: leaveRequestId,
      employeeId: approverEmployeeId,
      leaveRequestId: leaveRequestId,
      newValues: { status: 'REJECTED', approverEmployeeId, rejectionReason },
      ...this.getRequestMetadata(req),
    });
  }

  async logLeaveCancelled(
    leaveRequestId: string,
    leaveData: any,
    cancelledBy: string,
    reason: string,
    req?: Request
  ): Promise<void> {
    await this.log({
      action: AuditAction.LEAVE_CANCELLED,
      description: `Leave request ${leaveRequestId} for employee ${leaveData.employeeId} cancelled by ${cancelledBy}: ${leaveData.leaveTypeCode} (${leaveData.totalDays} days) - Reason: ${reason}`,
      entity: AuditEntity.LEAVE_REQUEST,
      entityId: leaveRequestId,
      employeeId: cancelledBy,
      leaveRequestId: leaveRequestId,
      oldValues: { status: leaveData.status },
      newValues: { status: 'CANCELLED', cancelledBy, reason },
      ...this.getRequestMetadata(req),
    });
  }

  async logLeaveBulkApproved(
    leaveRequestIds: string[],
    approverEmployeeId: string,
    count: number,
    req?: Request
  ): Promise<void> {
    await this.log({
      action: AuditAction.LEAVE_BULK_APPROVED,
      description: `Bulk approved ${count} leave requests by ${approverEmployeeId}`,
      entity: AuditEntity.LEAVE_REQUEST,
      entityId: 'BULK_APPROVE',
      employeeId: approverEmployeeId,
      newValues: { leaveRequestIds, count },
      ...this.getRequestMetadata(req),
    });
  }

  async logLeaveBulkRejected(
    leaveRequestIds: string[],
    approverEmployeeId: string,
    count: number,
    rejectionReason: string,
    req?: Request
  ): Promise<void> {
    await this.log({
      action: AuditAction.LEAVE_BULK_REJECTED,
      description: `Bulk rejected ${count} leave requests by ${approverEmployeeId} - Reason: ${rejectionReason}`,
      entity: AuditEntity.LEAVE_REQUEST,
      entityId: 'BULK_REJECT',
      employeeId: approverEmployeeId,
      newValues: { leaveRequestIds, count, rejectionReason },
      ...this.getRequestMetadata(req),
    });
  }

  // ======================
  // AUTHENTICATION AUDITS
  // ======================

  async logUserLogin(employeeId: string, req?: Request): Promise<void> {
    await this.log({
      action: AuditAction.USER_LOGIN,
      description: `User ${employeeId} logged in`,
      entity: AuditEntity.AUTHENTICATION,
      entityId: employeeId,
      employeeId: employeeId,
      ...this.getRequestMetadata(req),
    });
  }

  async logUserLogout(employeeId: string, req?: Request): Promise<void> {
    await this.log({
      action: AuditAction.USER_LOGOUT,
      description: `User ${employeeId} logged out`,
      entity: AuditEntity.AUTHENTICATION,
      entityId: employeeId,
      employeeId: employeeId,
      ...this.getRequestMetadata(req),
    });
  }

  async logPasswordChanged(employeeId: string, req?: Request): Promise<void> {
    await this.log({
      action: AuditAction.PASSWORD_CHANGED,
      description: `User ${employeeId} changed password`,
      entity: AuditEntity.AUTHENTICATION,
      entityId: employeeId,
      employeeId: employeeId,
      ...this.getRequestMetadata(req),
    });
  }

  // ======================
  // QUERY METHODS
  // ======================

  /**
   * Get audit logs with filters
   */
  async getAuditLogs(filters: {
    employeeId?: string;
    entity?: AuditEntity;
    action?: AuditAction;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const { employeeId, entity, action, entityId, startDate, endDate, page = 1, limit = 50 } = filters;

    const where: any = {};

    if (employeeId) where.employeeId = employeeId;
    if (entity) where.entity = entity;
    if (action) where.action = action;
    if (entityId) where.entityId = entityId;

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              employeeId: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get audit logs for a specific entity
   */
  async getEntityAuditHistory(entity: AuditEntity, entityId: string, limit: number = 50) {
    return await prisma.auditLog.findMany({
      where: {
        entity,
        entityId,
      },
      include: {
        user: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get audit logs for a specific user's actions
   */
  async getUserAuditLogs(employeeId: string, page: number = 1, limit: number = 50) {
    return this.getAuditLogs({ employeeId, page, limit });
  }

  /**
   * Get recent audit logs
   */
  async getRecentAuditLogs(limit: number = 100) {
    return await prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });
  }
}

export default new AuditService();

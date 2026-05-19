/**
 * @context test/lib/permissions.test.ts
 * @what    Unit tests for src/lib/permissions.ts
 * @covers  canManage, isAdmin, isManager, ROLES, COMPANIES
 * @layer   test
 */
import { describe, it, expect } from 'vitest';
import {
  canManage,
  isAdmin,
  isManager,
  ROLES,
  COMPANIES,
  COMPANIES_ALL,
} from '@/lib/permissions';

describe('ROLES', () => {
  it('deve conter admin, manager e employee', () => {
    expect(ROLES.ADMIN).toBe('admin');
    expect(ROLES.MANAGER).toBe('manager');
    expect(ROLES.EMPLOYEE).toBe('employee');
  });
});

describe('COMPANIES', () => {
  it('deve conter as 3 empresas', () => {
    expect(COMPANIES).toContain('AVAPEX');
    expect(COMPANIES).toContain('SEDAY');
    expect(COMPANIES).toContain('INNOMACH');
  });
  it('deve ter exatamente 3 empresas', () => {
    expect(COMPANIES).toHaveLength(3);
  });
});

describe('COMPANIES_ALL', () => {
  it('deve conter as 3 empresas + ALL', () => {
    expect(COMPANIES_ALL).toContain('ALL');
    expect(COMPANIES_ALL).toHaveLength(4);
  });
});

describe('canManage', () => {
  it('admin pode gerenciar', () => {
    expect(canManage(ROLES.ADMIN)).toBe(true);
  });
  it('manager pode gerenciar', () => {
    expect(canManage(ROLES.MANAGER)).toBe(true);
  });
  it('employee NÃO pode gerenciar', () => {
    expect(canManage(ROLES.EMPLOYEE)).toBe(false);
  });
  it('string desconhecida pode gerenciar (não é employee)', () => {
    expect(canManage('outro')).toBe(true);
  });
});

describe('isAdmin', () => {
  it('admin é admin', () => {
    expect(isAdmin(ROLES.ADMIN)).toBe(true);
  });
  it('manager não é admin', () => {
    expect(isAdmin(ROLES.MANAGER)).toBe(false);
  });
  it('employee não é admin', () => {
    expect(isAdmin(ROLES.EMPLOYEE)).toBe(false);
  });
});

describe('isManager', () => {
  it('manager é manager', () => {
    expect(isManager(ROLES.MANAGER)).toBe(true);
  });
  it('admin não é manager', () => {
    expect(isManager(ROLES.ADMIN)).toBe(false);
  });
  it('employee não é manager', () => {
    expect(isManager(ROLES.EMPLOYEE)).toBe(false);
  });
});

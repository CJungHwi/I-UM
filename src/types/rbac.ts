/**
 * DB rbac_permission.perm_code 와 동일한 문자열을 사용합니다.
 * 새 권한은 prisma/procedures/rbac.sql 에 추가 후 여기 상수를 맞춥니다.
 */
export const Perm = {
    dashboardView: "dashboard.view",
    crmAccess: "crm.access",
    crmProspectsManage: "crm.prospects.manage",
    crmStudentsManage: "crm.students.manage",
    lmsAccess: "lms.access",
    lmsClassesManage: "lms.classes.manage",
    erpAccess: "erp.access",
    hrmAccess: "hrm.access",
    threadRead: "thread.read",
    threadWrite: "thread.write",
    threadModerate: "thread.moderate",
    gamiView: "gami.view",
    gamiAdjust: "gami.adjust",
    adminUsersManage: "admin.users.manage",
    adminRegisterView: "admin.register.view",
    adminSettings: "admin.settings",
} as const

export type PermissionCode = (typeof Perm)[keyof typeof Perm] | (string & {})

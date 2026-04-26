import type { IumUserRole } from "@/types/ium-user"

/** 로그인·회원가입 UI: DB에 학원 미소속인 전역 관리자가 선택하는 값 */
export const IUM_LOGIN_SYSTEM_ACADEMY_VALUE = "__SYSTEM__" as const

/** 시스템 전체 관리자 — 모든 학원 데이터 접근 가능 */
export function isSystemAdmin(role: IumUserRole | undefined): boolean {
    return role === "SYSTEM_ADMIN"
}

/** 특정 학원에 소속된 관리자 — 학원 범위 데이터만 접근 */
export function isAcademyAdmin(role: IumUserRole | undefined): boolean {
    return role === "ACADEMY_ADMIN"
}

/** 학원 강사/일반 사용자 — 소속 학원 범위 데이터만 접근 */
export function isAcademyMember(role: IumUserRole | undefined): boolean {
    return role === "ACADEMY_MEMBER"
}

export function isAcademyScopedRole(role: IumUserRole | undefined): boolean {
    return role === "ACADEMY_ADMIN" || role === "ACADEMY_MEMBER"
}

/** 사이드바 메뉴(get_menu)용 숫자 레벨 — 기존 DB 메뉴 권한과 호환 */
export function mapToMenuLevel(role: IumUserRole): number {
    if (role === "SYSTEM_ADMIN") return 10
    if (role === "ACADEMY_ADMIN") return 9
    return 2
}

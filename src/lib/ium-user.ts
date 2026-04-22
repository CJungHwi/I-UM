import type { IumUserLevel, IumUserGrade } from "@/types/ium-user"

/** 로그인·회원가입 UI: DB에 학원 미소속인 전역 관리자가 선택하는 값 */
export const IUM_LOGIN_SYSTEM_ACADEMY_VALUE = "__SYSTEM__" as const

/** DB에서 academy_id가 비어 있는 ADMIN = 전역 시스템 관리자(모든 학원·전체 발송) */
export function isSystemAdmin(
    userGrade: IumUserGrade | undefined,
    academyId: number | null | undefined,
): boolean {
    return userGrade === "ADMIN" && (academyId == null || academyId <= 0)
}

/** 특정 학원에 소속된 관리자 — 학원 단위 알림만 발송 */
export function isAcademyAdmin(
    userGrade: IumUserGrade | undefined,
    academyId: number | null | undefined,
): boolean {
    return userGrade === "ADMIN" && academyId != null && academyId > 0
}

/** 사이드바 메뉴(get_menu)용 숫자 레벨 — 기존 DB 메뉴 권한과 호환 */
export function mapToMenuLevel(
    userLevel: IumUserLevel,
    userGrade: IumUserGrade,
): number {
    if (userLevel === "DIRECTOR" && userGrade === "ADMIN") return 10
    if (userLevel === "DIRECTOR" && userGrade === "USER") return 9
    if (userLevel === "TEACHER" && userGrade === "ADMIN") return 8
    if (userLevel === "TEACHER" && userGrade === "USER") return 2
    return 2
}

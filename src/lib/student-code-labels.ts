/** 코드가 맵에 없으면 DB에 저장된 문자열(레거시 자유입력) 그대로 반환 */
export const labelForStudentCode = (
    code: string | null | undefined,
    labelByCode: Record<string, string>,
): string => {
    if (code == null || String(code).trim() === "") return ""
    const c = String(code).trim()
    return labelByCode[c] ?? c
}

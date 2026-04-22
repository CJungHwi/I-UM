import bcrypt from "bcryptjs"

/**
 * 비밀번호 해싱 함수
 * @param password - 평문 비밀번호
 * @returns 해시된 비밀번호
 */
export async function hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return await bcrypt.hash(password, saltRounds)
}

/**
 * 비밀번호 검증 함수
 * @param password - 사용자가 입력한 평문 비밀번호
 * @param hashedPassword - 데이터베이스에 저장된 해시된 비밀번호
 * @returns 비밀번호가 일치하면 true, 아니면 false
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
        return await bcrypt.compare(password, hashedPassword)
    } catch (error) {
        console.error("Password verification error:", error)
        return false
    }
}

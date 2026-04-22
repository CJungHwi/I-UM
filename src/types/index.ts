// 공통 타입만 유지
export type ServerActionResult<T = void> = 
    | { success: true; data?: T }
    | { success: false; error: string }

import "next-auth"
import "next-auth/jwt"
import type { IumUserGrade, IumUserLevel } from "@/types/ium-user"

declare module "next-auth" {
    interface User {
        mbId?: string
        mbLevel?: number
        userLevel?: IumUserLevel
        userGrade?: IumUserGrade
        /** NULL이면 전역(시스템) 관리자로 취급 가능 */
        academyId?: number | null
    }

    interface Session {
        user: {
            id: number
            mbId?: string
            name?: string | null
            email?: string | null
            image?: string | null
            mbLevel?: number
            userLevel?: IumUserLevel
            userGrade?: IumUserGrade
            /** 소속 학원. NULL이면 전역 운영자(시스템 관리자) 구분에 사용 */
            academyId: number | null
            /** sp_rbac_list_permissions_by_role 결과 */
            permissions: string[]
        }
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: number
        mbId?: string
        mbLevel?: number
        userLevel?: IumUserLevel
        userGrade?: IumUserGrade
        academyId?: number | null
        permissions?: string[]
    }
}

import NextAuth from "next-auth"
import type { Session } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { authConfig } from "./auth.config"
import { callProcedure } from "@/lib/db"
import { verifyPassword } from "@/lib/password"
import { IUM_LOGIN_SYSTEM_ACADEMY_VALUE, mapToMenuLevel } from "@/lib/ium-user"
import { buildRoleCode } from "@/lib/rbac"
import type { IumUserGrade, IumUserLevel } from "@/types/ium-user"
import { z } from "zod"

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                const rawUserId = (user as any).id as unknown
                token.id =
                    typeof rawUserId === "number"
                        ? rawUserId
                        : typeof rawUserId === "string" && rawUserId.trim()
                            ? Number(rawUserId)
                            : undefined
                token.mbId = (user as any).mbId
                token.name = user.name
                token.email = (user as any).email
                token.mbLevel = (user as any).mbLevel
                token.userLevel = (user as any).userLevel
                token.userGrade = (user as any).userGrade
                token.academyId =
                    (user as any).academyId !== undefined && (user as any).academyId !== null
                        ? Number((user as any).academyId)
                        : null
                if (token.academyId !== null && (Number.isNaN(token.academyId) || token.academyId <= 0)) {
                    token.academyId = null
                }

                const ul = (user as any).userLevel as IumUserLevel | undefined
                const ug = (user as any).userGrade as IumUserGrade | undefined
                if (ul && ug) {
                    const roleCode = buildRoleCode(ul, ug)
                    try {
                        const rows = await callProcedure<{
                            perm_code?: string
                            permCode?: string
                        }>("sp_rbac_list_permissions_by_role", roleCode)
                        token.permissions = (rows ?? [])
                            .map((r) => r.perm_code ?? r.permCode ?? "")
                            .filter(Boolean)
                    } catch {
                        token.permissions = []
                    }
                } else {
                    token.permissions = []
                }
            }
            return token
        },
        async session({ session, token }): Promise<Session> {
            return {
                ...session,
                user: {
                    id: typeof token.id === "number" ? token.id : 0,
                    mbId: token.mbId as string | undefined,
                    name: token.name ?? null,
                    email: (token.email as string | null | undefined) ?? null,
                    image: session.user?.image ?? null,
                    mbLevel: token.mbLevel as number | undefined,
                    userLevel: token.userLevel as IumUserLevel | undefined,
                    userGrade: token.userGrade as IumUserGrade | undefined,
                    academyId:
                        token.academyId !== undefined && token.academyId !== null
                            ? Number(token.academyId)
                            : null,
                    permissions: Array.isArray(token.permissions)
                        ? token.permissions
                        : [],
                },
            }
        },
    },
    providers: [
        Credentials({
            async authorize(credentials) {
                try {
                    const parsedCredentials = z
                        .object({
                            id: z.string().min(1),
                            password: z.string().min(1),
                            academyId: z.string().optional(),
                        })
                        .safeParse(credentials)

                    if (!parsedCredentials.success) {
                        console.error("Invalid credentials format:", parsedCredentials.error)
                        return null
                    }

                    const { id, password, academyId: academyChoiceRaw } = parsedCredentials.data
                    const academyChoice = (academyChoiceRaw ?? "").trim()

                    const iumResults = await callProcedure<any>("sp_ium_get_user_by_login", id)

                    if (iumResults && iumResults.length > 0) {
                        const row = iumResults[0]
                        const loginId = row.loginId ?? row.login_id ?? row.f1 ?? ""
                        const passwordHash = row.passwordHash ?? row.password_hash ?? row.f2 ?? ""
                        const name = row.name ?? row.f3 ?? ""
                        const email = row.email ?? row.f4 ?? null
                        const userLevel = (row.userLevel ?? row.user_level ?? row.f5 ?? "TEACHER") as IumUserLevel
                        const userGrade = (row.userGrade ?? row.user_grade ?? row.f6 ?? "USER") as IumUserGrade
                        const uid = row.id ?? row.f0 ?? 0
                        const rawAcademy = row.academyId ?? row.academy_id
                        const parsedAcademy =
                            rawAcademy != null && rawAcademy !== "" ? Number(rawAcademy) : NaN
                        const academyId =
                            Number.isFinite(parsedAcademy) && parsedAcademy > 0 ? parsedAcademy : null

                        if (!loginId || !passwordHash) {
                            return null
                        }

                        const passwordsMatch = await verifyPassword(password, passwordHash)
                        if (!passwordsMatch) {
                            console.error(`Password mismatch for ium user: ${loginId}`)
                            return null
                        }

                        if (academyId != null && academyId > 0) {
                            const sel = Number(academyChoice)
                            if (!Number.isFinite(sel) || sel !== academyId) {
                                console.error(`Academy mismatch for ium user: ${loginId}`)
                                return null
                            }
                        } else {
                            if (userGrade === "ADMIN") {
                                if (academyChoice !== IUM_LOGIN_SYSTEM_ACADEMY_VALUE) {
                                    console.error(`System admin must select 전역 for: ${loginId}`)
                                    return null
                                }
                            } else {
                                console.error(`Invalid academy state for ium user: ${loginId}`)
                                return null
                            }
                        }

                        const mbLevel = mapToMenuLevel(userLevel, userGrade)

                        return {
                            id: uid,
                            mbId: loginId,
                            name,
                            email,
                            mbLevel,
                            userLevel,
                            userGrade,
                            academyId,
                        }
                    }

                    const legacyResults = await callProcedure<any>("get_user_by_id", id)

                    if (!legacyResults || legacyResults.length === 0) {
                        console.error(`User not found: login=${id}`)
                        return null
                    }

                    const userData = legacyResults[0]
                    const user = {
                        id: userData.id ?? userData.f0 ?? 0,
                        mbId: userData.mb_id ?? userData.f1 ?? "",
                        password: userData.password ?? userData.f2 ?? "",
                        name: userData.name ?? userData.f3 ?? "",
                        email: userData.email ?? userData.f4 ?? null,
                        mbLevel: userData.mbLevel ?? userData.f5 ?? 0,
                    }

                    if (!user.mbId) {
                        return null
                    }

                    const passwordsMatch = await verifyPassword(password, user.password)
                    if (!passwordsMatch) {
                        return null
                    }

                    return {
                        id: user.id,
                        mbId: user.mbId,
                        name: user.name,
                        email: user.email,
                        mbLevel: user.mbLevel,
                        userLevel: "TEACHER" as IumUserLevel,
                        userGrade: "USER" as IumUserGrade,
                    }
                } catch (error) {
                    console.error("Authentication error:", error)
                    return null
                }
            },
        }),
    ],
})

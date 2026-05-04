import "server-only"

/**
 * 신규 학원(첫 ACADEMY_ADMIN)이 Super Admin 승인 직후 과금·구독을 시작할 때 호출 예정.
 * PG/정기결제 API 연동 후 아래 주석을 해제하고 `approveIumUser` 에서 호출하세요.
 */
export async function startAcademyBillingAfterAdminApproval(_params: {
    academyId: number
    adminUserId: number
}): Promise<void> {
    void _params.academyId
    void _params.adminUserId
    /* 결제·구독 시작 (예: PG 약정 생성)
       await billing.createSubscription({ ... })
    */
}

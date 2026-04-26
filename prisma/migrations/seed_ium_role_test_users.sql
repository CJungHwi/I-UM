-- 3단계 권한 체계 테스트 데이터
-- 공통 비밀번호: Test1234!
-- 계정:
--   system.admin.test / Test1234!  => SYSTEM_ADMIN
--   academy.admin.test / Test1234! => ACADEMY_ADMIN
--   academy.member.test / Test1234! => ACADEMY_MEMBER

SET @test_password_hash = '$2b$10$UJgW7OggNgjdhmGhvubG4u2bHlLlgfvOUOw8x0Hn3JAeHF9wsGPUS';

INSERT INTO ium_academies (name, is_active, display_order)
VALUES ('테스트 학원', 'Y', 999)
ON DUPLICATE KEY UPDATE
    is_active = VALUES(is_active),
    display_order = VALUES(display_order);

SET @test_academy_id = (
    SELECT id
    FROM ium_academies
    WHERE name = '테스트 학원'
    ORDER BY id ASC
    LIMIT 1
);

INSERT INTO ium_users (
    login_id,
    password_hash,
    name,
    email,
    academy_id,
    role,
    user_level,
    user_grade,
    approval_status,
    del_yn
) VALUES (
    'system.admin.test',
    @test_password_hash,
    '시스템 전체 관리자 테스트',
    'system.admin.test@example.com',
    NULL,
    'SYSTEM_ADMIN',
    'DIRECTOR',
    'ADMIN',
    'APPROVED',
    'N'
)
ON DUPLICATE KEY UPDATE
    password_hash = VALUES(password_hash),
    name = VALUES(name),
    email = VALUES(email),
    academy_id = VALUES(academy_id),
    role = VALUES(role),
    user_level = VALUES(user_level),
    user_grade = VALUES(user_grade),
    approval_status = VALUES(approval_status),
    del_yn = VALUES(del_yn);

INSERT INTO ium_users (
    login_id,
    password_hash,
    name,
    email,
    academy_id,
    role,
    user_level,
    user_grade,
    approval_status,
    del_yn
) VALUES (
    'academy.admin.test',
    @test_password_hash,
    '학원관리자 테스트',
    'academy.admin.test@example.com',
    @test_academy_id,
    'ACADEMY_ADMIN',
    'DIRECTOR',
    'ADMIN',
    'APPROVED',
    'N'
)
ON DUPLICATE KEY UPDATE
    password_hash = VALUES(password_hash),
    name = VALUES(name),
    email = VALUES(email),
    academy_id = VALUES(academy_id),
    role = VALUES(role),
    user_level = VALUES(user_level),
    user_grade = VALUES(user_grade),
    approval_status = VALUES(approval_status),
    del_yn = VALUES(del_yn);

INSERT INTO ium_users (
    login_id,
    password_hash,
    name,
    email,
    academy_id,
    role,
    user_level,
    user_grade,
    approval_status,
    del_yn
) VALUES (
    'academy.member.test',
    @test_password_hash,
    '학원강사 테스트',
    'academy.member.test@example.com',
    @test_academy_id,
    'ACADEMY_MEMBER',
    'TEACHER',
    'USER',
    'APPROVED',
    'N'
)
ON DUPLICATE KEY UPDATE
    password_hash = VALUES(password_hash),
    name = VALUES(name),
    email = VALUES(email),
    academy_id = VALUES(academy_id),
    role = VALUES(role),
    user_level = VALUES(user_level),
    user_grade = VALUES(user_grade),
    approval_status = VALUES(approval_status),
    del_yn = VALUES(del_yn);

SELECT
    login_id AS loginId,
    name,
    role,
    academy_id AS academyId,
    approval_status AS approvalStatus
FROM ium_users
WHERE login_id IN ('system.admin.test', 'academy.admin.test', 'academy.member.test')
ORDER BY FIELD(role, 'SYSTEM_ADMIN', 'ACADEMY_ADMIN', 'ACADEMY_MEMBER');

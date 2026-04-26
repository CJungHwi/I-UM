-- 사용자 권한 3단계 전환: 단일 role 컬럼 추가
-- 역할:
--   SYSTEM_ADMIN   = 시스템 전체 관리자 (academy_id NULL)
--   ACADEMY_ADMIN  = 소속 학원 관리자 (academy_id 필수)
--   ACADEMY_MEMBER = 소속 학원 강사/일반 사용자 (academy_id 필수)

ALTER TABLE ium_users
    ADD COLUMN role VARCHAR(30) NULL COMMENT 'SYSTEM_ADMIN/ACADEMY_ADMIN/ACADEMY_MEMBER' AFTER academy_id;

UPDATE ium_users
SET role = CASE
    WHEN user_grade = 'ADMIN' AND (academy_id IS NULL OR academy_id <= 0) THEN 'SYSTEM_ADMIN'
    WHEN user_grade = 'ADMIN' AND academy_id IS NOT NULL AND academy_id > 0 THEN 'ACADEMY_ADMIN'
    ELSE 'ACADEMY_MEMBER'
END
WHERE role IS NULL OR role = '';

ALTER TABLE ium_users
    MODIFY COLUMN role VARCHAR(30) NOT NULL DEFAULT 'ACADEMY_MEMBER'
    COMMENT 'SYSTEM_ADMIN/ACADEMY_ADMIN/ACADEMY_MEMBER';

ALTER TABLE ium_users
    ADD INDEX idx_role (role);

-- 데이터 검증용:
-- SELECT role, academy_id IS NULL AS no_academy, COUNT(*) FROM ium_users GROUP BY role, academy_id IS NULL;

-- ============================================================
-- 학원 초대 코드 컬럼 (1회 적용)
-- 이미 invite_code 가 있으면 이 파일 전체를 건너뛰세요.
-- 이후 prisma/procedures/ium_register_extensions.sql 프로시저를 실행하세요.
-- ============================================================

ALTER TABLE ium_academies
    ADD COLUMN invite_code VARCHAR(64) NULL COMMENT '초대 가입용 코드' AFTER name;

CREATE UNIQUE INDEX uq_ium_academies_invite_code ON ium_academies (invite_code);

-- 기존 DB: 알림에 scope(시스템/학원) 및 academy_id 추가, audience 값 정리
-- notifications.sql 적용 이후 한 번 실행하세요.

ALTER TABLE ium_notifications
    ADD COLUMN scope VARCHAR(20) NOT NULL DEFAULT 'SYSTEM' COMMENT 'SYSTEM=전역, ACADEMY=학원' AFTER id,
    ADD COLUMN academy_id BIGINT NULL COMMENT 'scope=ACADEMY 일 때 소속 학원' AFTER scope,
    ADD INDEX idx_scope_academy (scope, academy_id);

UPDATE ium_notifications SET scope = 'SYSTEM' WHERE scope = '' OR scope IS NULL;
UPDATE ium_notifications SET audience = 'ALL_ADMINS' WHERE audience = 'ADMIN';

-- 이후 프로시저는 prisma/procedures/notifications.sql 최신본으로 교체 실행

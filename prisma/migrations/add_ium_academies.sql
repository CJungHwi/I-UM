-- 학원(소속) 마스터 및 ium_users FK
-- 기존 DB에 적용: 아래를 순서대로 실행

CREATE TABLE IF NOT EXISTS ium_academies (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(200) NOT NULL COMMENT '학원명',
    is_active     CHAR(1)      NOT NULL DEFAULT 'Y' COMMENT 'Y/N',
    display_order INT          NOT NULL DEFAULT 0,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active_order (is_active, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='이음 소속 학원';

-- 운영 시 실제 학원명으로 INSERT 후 사용
-- INSERT INTO ium_academies (name, is_active, display_order) VALUES ('샘플 학원', 'Y', 0);

ALTER TABLE ium_users
    ADD COLUMN academy_id BIGINT NULL COMMENT '소속 학원 FK' AFTER email;

ALTER TABLE ium_users
    ADD INDEX idx_academy (academy_id);

ALTER TABLE ium_users
    ADD CONSTRAINT fk_ium_users_academy
    FOREIGN KEY (academy_id) REFERENCES ium_academies (id)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- 이후 `prisma/procedures/ium_users.sql` 의 프로시저 DROP/CREATE 블록을 실행해
-- sp_ium_list_academies_for_register 및 변경된 sp_ium_register 등을 반영하세요.

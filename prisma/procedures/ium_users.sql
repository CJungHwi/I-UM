-- ============================================================
-- 이음(I-UM) 사용자 · 소속 학원 테이블 및 프로시저
-- DB/연결 콜레이션을 utf8mb4_unicode_ci 로 통일한 뒤 사용하세요.
-- 프로시저 갱신 시: 아래 DROP 후 CREATE 블록 실행
-- 기존 DB에 academy 컬럼만 추가하는 경우: prisma/migrations/add_ium_academies.sql
-- ============================================================

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

CREATE TABLE IF NOT EXISTS ium_users (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    login_id         VARCHAR(50)  NOT NULL COMMENT '로그인 ID',
    password_hash    VARCHAR(255) NOT NULL COMMENT 'bcrypt 등 해시',
    name             VARCHAR(100) NOT NULL,
    email            VARCHAR(200) NULL,
    academy_id       BIGINT       NULL COMMENT '소속 학원 FK',
    user_level       VARCHAR(20)  NOT NULL COMMENT 'DIRECTOR=원장, TEACHER=교사',
    user_grade       VARCHAR(20)  NOT NULL DEFAULT 'USER' COMMENT 'ADMIN=관리자, USER=일반',
    approval_status  VARCHAR(20)  NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING/APPROVED/REJECTED',
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    del_yn           CHAR(1)      NOT NULL DEFAULT 'N',
    UNIQUE KEY uq_ium_login (login_id),
    INDEX idx_approval (approval_status),
    INDEX idx_grade (user_grade),
    INDEX idx_academy (academy_id),
    CONSTRAINT fk_ium_users_academy
        FOREIGN KEY (academy_id) REFERENCES ium_academies (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='이음 시스템 사용자';

DROP PROCEDURE IF EXISTS sp_ium_list_academies_for_register;
DROP PROCEDURE IF EXISTS sp_ium_get_user_by_login;
DROP PROCEDURE IF EXISTS sp_ium_register;
DROP PROCEDURE IF EXISTS sp_ium_list_users;
DROP PROCEDURE IF EXISTS sp_ium_list_users_for_academy;
DROP PROCEDURE IF EXISTS sp_ium_approve_user;
DROP PROCEDURE IF EXISTS sp_ium_reject_user;
DROP PROCEDURE IF EXISTS sp_ium_set_user_grade;
DROP PROCEDURE IF EXISTS sp_ium_set_user_level;

DELIMITER $$

CREATE PROCEDURE sp_ium_list_academies_for_register()
BEGIN
    SELECT
        a.id,
        a.name AS academyName
    FROM ium_academies a
    WHERE a.is_active = 'Y'
    ORDER BY a.display_order ASC, a.name ASC;
END$$

CREATE PROCEDURE sp_ium_get_user_by_login(
    IN p_login_id VARCHAR(50)
)
BEGIN
    SELECT
        u.id,
        u.login_id        AS loginId,
        u.password_hash   AS passwordHash,
        u.name,
        u.email,
        u.user_level      AS userLevel,
        u.user_grade      AS userGrade,
        u.approval_status AS approvalStatus,
        u.academy_id      AS academyId,
        a.name            AS academyName
    FROM ium_users u
    LEFT JOIN ium_academies a ON a.id = u.academy_id
    WHERE u.login_id = p_login_id
      AND u.del_yn = 'N'
      AND u.approval_status = 'APPROVED';
END$$

CREATE PROCEDURE sp_ium_register(
    IN p_login_id      VARCHAR(50),
    IN p_password_hash VARCHAR(255),
    IN p_name          VARCHAR(100),
    IN p_email         VARCHAR(200),
    IN p_user_level    VARCHAR(20),
    IN p_academy_id    BIGINT
)
BEGIN
    DECLARE v_cnt INT DEFAULT 0;
    DECLARE v_ac INT DEFAULT 0;

    SELECT COUNT(*) INTO v_cnt FROM ium_users WHERE login_id = p_login_id AND del_yn = 'N';
    IF v_cnt > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DUPLICATE_LOGIN_ID';
    END IF;

    IF p_academy_id IS NULL OR p_academy_id <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ACADEMY_REQUIRED';
    END IF;

    SELECT COUNT(*) INTO v_ac FROM ium_academies WHERE id = p_academy_id AND is_active = 'Y';
    IF v_ac = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_ACADEMY';
    END IF;

    INSERT INTO ium_users (login_id, password_hash, name, email, academy_id, user_level, user_grade, approval_status)
    VALUES (p_login_id, p_password_hash, p_name, NULLIF(TRIM(p_email), ''), p_academy_id, p_user_level, 'USER', 'PENDING');

    SELECT LAST_INSERT_ID() AS id;
END$$

CREATE PROCEDURE sp_ium_list_users(
    IN p_status VARCHAR(20)
)
BEGIN
    SELECT
        u.id,
        u.login_id        AS loginId,
        u.name,
        u.email,
        u.user_level      AS userLevel,
        u.user_grade      AS userGrade,
        u.approval_status AS approvalStatus,
        u.academy_id      AS academyId,
        a.name            AS academyName,
        u.created_at      AS createdAt,
        u.updated_at      AS updatedAt
    FROM ium_users u
    LEFT JOIN ium_academies a ON a.id = u.academy_id
    WHERE u.del_yn = 'N'
      AND (p_status IS NULL OR p_status = '' OR u.approval_status = p_status)
    ORDER BY
        FIELD(u.approval_status, 'PENDING', 'APPROVED', 'REJECTED'),
        u.created_at DESC;
END$$

CREATE PROCEDURE sp_ium_list_users_for_academy(
    IN p_academy_id BIGINT,
    IN p_status VARCHAR(20)
)
BEGIN
    SELECT
        u.id,
        u.login_id        AS loginId,
        u.name,
        u.email,
        u.user_level      AS userLevel,
        u.user_grade      AS userGrade,
        u.approval_status AS approvalStatus,
        u.academy_id      AS academyId,
        a.name            AS academyName,
        u.created_at      AS createdAt,
        u.updated_at      AS updatedAt
    FROM ium_users u
    LEFT JOIN ium_academies a ON a.id = u.academy_id
    WHERE u.del_yn = 'N'
      AND u.academy_id = p_academy_id
      AND (p_status IS NULL OR p_status = '' OR u.approval_status = p_status)
    ORDER BY u.name ASC;
END$$

CREATE PROCEDURE sp_ium_approve_user(
    IN p_id BIGINT
)
BEGIN
    UPDATE ium_users
    SET approval_status = 'APPROVED',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_id AND del_yn = 'N';

    SELECT ROW_COUNT() AS affected;
END$$

CREATE PROCEDURE sp_ium_reject_user(
    IN p_id BIGINT
)
BEGIN
    UPDATE ium_users
    SET approval_status = 'REJECTED',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_id AND del_yn = 'N';

    SELECT ROW_COUNT() AS affected;
END$$

CREATE PROCEDURE sp_ium_set_user_grade(
    IN p_id    BIGINT,
    IN p_grade VARCHAR(20)
)
BEGIN
    UPDATE ium_users
    SET user_grade = p_grade,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_id AND del_yn = 'N' AND approval_status = 'APPROVED';

    SELECT ROW_COUNT() AS affected;
END$$

CREATE PROCEDURE sp_ium_set_user_level(
    IN p_id    BIGINT,
    IN p_level VARCHAR(20)
)
BEGIN
    UPDATE ium_users
    SET user_level = p_level,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_id AND del_yn = 'N' AND approval_status = 'APPROVED';

    SELECT ROW_COUNT() AS affected;
END$$

DELIMITER ;

-- 최초 관리자: UPDATE ium_users SET user_grade='ADMIN', approval_status='APPROVED' WHERE login_id='첫계정';
-- 학원 등록: INSERT INTO ium_academies (name, is_active, display_order) VALUES ('○○학원', 'Y', 0);

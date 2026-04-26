-- ============================================================
-- 이음(I-UM) 사용자 · 소속 학원 테이블 및 프로시저
-- 권한 체계: SYSTEM_ADMIN / ACADEMY_ADMIN / ACADEMY_MEMBER
-- DB/연결 콜레이션을 utf8mb4_unicode_ci 로 통일한 뒤 사용하세요.
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
    academy_id       BIGINT       NULL COMMENT '소속 학원 FK. SYSTEM_ADMIN은 NULL',
    role             VARCHAR(30)  NOT NULL DEFAULT 'ACADEMY_MEMBER'
                     COMMENT 'SYSTEM_ADMIN/ACADEMY_ADMIN/ACADEMY_MEMBER',
    user_level       VARCHAR(20)  NOT NULL DEFAULT 'TEACHER' COMMENT 'legacy',
    user_grade       VARCHAR(20)  NOT NULL DEFAULT 'USER' COMMENT 'legacy',
    approval_status  VARCHAR(20)  NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING/APPROVED/REJECTED',
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    del_yn           CHAR(1)      NOT NULL DEFAULT 'N',
    UNIQUE KEY uq_ium_login (login_id),
    INDEX idx_approval (approval_status),
    INDEX idx_role (role),
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
DROP PROCEDURE IF EXISTS sp_ium_set_user_role;
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
        u.role,
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

    INSERT INTO ium_users (
        login_id,
        password_hash,
        name,
        email,
        academy_id,
        role,
        user_level,
        user_grade,
        approval_status
    )
    VALUES (
        p_login_id,
        p_password_hash,
        p_name,
        NULLIF(TRIM(p_email), ''),
        p_academy_id,
        'ACADEMY_MEMBER',
        'TEACHER',
        'USER',
        'PENDING'
    );

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
        u.role,
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
        u.role,
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

CREATE PROCEDURE sp_ium_set_user_role(
    IN p_id   BIGINT,
    IN p_role VARCHAR(30)
)
BEGIN
    IF p_role NOT IN ('SYSTEM_ADMIN', 'ACADEMY_ADMIN', 'ACADEMY_MEMBER') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_ROLE';
    END IF;

    UPDATE ium_users
    SET role = p_role,
        academy_id = CASE
            WHEN p_role = 'SYSTEM_ADMIN' THEN NULL
            ELSE academy_id
        END,
        user_level = CASE
            WHEN p_role IN ('SYSTEM_ADMIN', 'ACADEMY_ADMIN') THEN 'DIRECTOR'
            ELSE 'TEACHER'
        END,
        user_grade = CASE
            WHEN p_role IN ('SYSTEM_ADMIN', 'ACADEMY_ADMIN') THEN 'ADMIN'
            ELSE 'USER'
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_id
      AND del_yn = 'N'
      AND approval_status = 'APPROVED'
      AND (
          p_role = 'SYSTEM_ADMIN'
          OR (p_role IN ('ACADEMY_ADMIN', 'ACADEMY_MEMBER') AND academy_id IS NOT NULL)
      );

    SELECT ROW_COUNT() AS affected;
END$$

DELIMITER ;

-- 최초 시스템 관리자 예시:
-- UPDATE ium_users
--    SET role='SYSTEM_ADMIN', user_level='DIRECTOR', user_grade='ADMIN', academy_id=NULL, approval_status='APPROVED'
--  WHERE login_id='첫계정';
-- 학원 등록: INSERT INTO ium_academies (name, is_active, display_order) VALUES ('○○학원', 'Y', 0);

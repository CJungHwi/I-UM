-- 신규 학원+관리자 가입 / 초대 코드 조회·가입
-- MySQL: DELIMITER $$ 로 감싼 뒤 실행하거나 Workbench에서 실행

DROP PROCEDURE IF EXISTS sp_ium_resolve_invite_code;
DROP PROCEDURE IF EXISTS sp_ium_register_new_academy_and_admin;
DROP PROCEDURE IF EXISTS sp_ium_register_by_invite_code;

DELIMITER $$

CREATE PROCEDURE sp_ium_resolve_invite_code(IN p_code VARCHAR(64))
BEGIN
    SELECT
        a.id AS academyId,
        a.name AS academyName
    FROM ium_academies a
    WHERE a.is_active = 'Y'
      AND a.invite_code IS NOT NULL
      AND a.invite_code = TRIM(p_code)
    LIMIT 1;
END$$

CREATE PROCEDURE sp_ium_register_new_academy_and_admin(
    IN p_academy_name VARCHAR(200),
    IN p_login_id VARCHAR(50),
    IN p_password_hash VARCHAR(255),
    IN p_name VARCHAR(100),
    IN p_email VARCHAR(200)
)
BEGIN
    DECLARE v_aid BIGINT DEFAULT 0;
    DECLARE v_invite VARCHAR(64);
    DECLARE v_cnt INT DEFAULT 0;
    DECLARE v_nm VARCHAR(200);

    SET v_nm = TRIM(p_academy_name);
    IF v_nm = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'EMPTY_ACADEMY_NAME';
    END IF;

    SELECT COUNT(*) INTO v_cnt FROM ium_users WHERE login_id = TRIM(p_login_id) AND del_yn = 'N';
    IF v_cnt > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DUPLICATE_LOGIN_ID';
    END IF;

    INSERT INTO ium_academies (name, is_active, display_order, invite_code)
    VALUES (v_nm, 'Y', 0, NULL);

    SET v_aid = LAST_INSERT_ID();
    SET v_invite = CONCAT('IUM-', UPPER(HEX(RANDOM_BYTES(8))));

    UPDATE ium_academies
    SET invite_code = v_invite
    WHERE id = v_aid;

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
        TRIM(p_login_id),
        p_password_hash,
        TRIM(p_name),
        NULLIF(TRIM(p_email), ''),
        v_aid,
        'ACADEMY_ADMIN',
        'DIRECTOR',
        'ADMIN',
        'PENDING'
    );

    SELECT v_aid AS academyId, v_invite AS inviteCode, LAST_INSERT_ID() AS userId;
END$$

CREATE PROCEDURE sp_ium_register_by_invite_code(
    IN p_login_id VARCHAR(50),
    IN p_password_hash VARCHAR(255),
    IN p_name VARCHAR(100),
    IN p_email VARCHAR(200),
    IN p_invite_code VARCHAR(64)
)
BEGIN
    DECLARE v_aid BIGINT DEFAULT NULL;
    DECLARE v_cnt INT DEFAULT 0;

    SELECT id INTO v_aid
    FROM ium_academies
    WHERE is_active = 'Y'
      AND invite_code IS NOT NULL
      AND invite_code = TRIM(p_invite_code)
    LIMIT 1;

    IF v_aid IS NULL OR v_aid <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_INVITE_CODE';
    END IF;

    SELECT COUNT(*) INTO v_cnt FROM ium_users WHERE login_id = TRIM(p_login_id) AND del_yn = 'N';
    IF v_cnt > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DUPLICATE_LOGIN_ID';
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
        TRIM(p_login_id),
        p_password_hash,
        TRIM(p_name),
        NULLIF(TRIM(p_email), ''),
        v_aid,
        'ACADEMY_MEMBER',
        'TEACHER',
        'USER',
        'PENDING'
    );

    SELECT LAST_INSERT_ID() AS id, v_aid AS academyId;
END$$

DELIMITER ;

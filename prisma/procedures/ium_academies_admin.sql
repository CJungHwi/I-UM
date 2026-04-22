-- 학원(소속) 마스터 관리용 프로시저 (관리자 전용 — 액션에서 userGrade=ADMIN 검증)
-- 선행: ium_academies 테이블 존재 (prisma/migrations/add_ium_academies.sql 등)

DROP PROCEDURE IF EXISTS sp_ium_admin_list_academies;
DROP PROCEDURE IF EXISTS sp_ium_admin_create_academy;
DROP PROCEDURE IF EXISTS sp_ium_admin_update_academy;
DROP PROCEDURE IF EXISTS sp_ium_admin_delete_academy;

DELIMITER $$

CREATE PROCEDURE sp_ium_admin_list_academies()
BEGIN
    SELECT
        a.id,
        a.name,
        a.is_active      AS isActive,
        a.display_order  AS displayOrder,
        (
            SELECT COUNT(*)
            FROM ium_users u
            WHERE u.academy_id = a.id
              AND u.del_yn = 'N'
        ) AS userCount
    FROM ium_academies a
    ORDER BY a.display_order ASC, a.id ASC;
END$$

CREATE PROCEDURE sp_ium_admin_create_academy(
    IN p_name          VARCHAR(200),
    IN p_display_order INT,
    IN p_is_active     CHAR(1)
)
BEGIN
    IF p_name IS NULL OR TRIM(p_name) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NAME_REQUIRED';
    END IF;
    IF p_is_active IS NULL OR p_is_active NOT IN ('Y', 'N') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_ACTIVE';
    END IF;

    INSERT INTO ium_academies (name, is_active, display_order)
    VALUES (TRIM(p_name), p_is_active, IFNULL(p_display_order, 0));

    SELECT LAST_INSERT_ID() AS id;
END$$

CREATE PROCEDURE sp_ium_admin_update_academy(
    IN p_id            BIGINT,
    IN p_name          VARCHAR(200),
    IN p_display_order INT,
    IN p_is_active     CHAR(1)
)
BEGIN
    IF p_id IS NULL OR p_id <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_ID';
    END IF;
    IF p_name IS NULL OR TRIM(p_name) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NAME_REQUIRED';
    END IF;
    IF p_is_active NOT IN ('Y', 'N') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_ACTIVE';
    END IF;

    UPDATE ium_academies
    SET name = TRIM(p_name),
        display_order = IFNULL(p_display_order, 0),
        is_active = p_is_active,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_id;

    SELECT ROW_COUNT() AS affected;
END$$

CREATE PROCEDURE sp_ium_admin_delete_academy(
    IN p_id BIGINT
)
BEGIN
    DECLARE v_cnt INT DEFAULT 0;

    IF p_id IS NULL OR p_id <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_ID';
    END IF;

    SELECT COUNT(*) INTO v_cnt FROM ium_users WHERE academy_id = p_id AND del_yn = 'N';
    IF v_cnt > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ACADEMY_IN_USE';
    END IF;

    DELETE FROM ium_academies WHERE id = p_id;

    SELECT ROW_COUNT() AS affected;
END$$

DELIMITER ;

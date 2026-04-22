-- ============================================================
-- 알림: 템플릿 + 발송 + 읽음
-- scope=SYSTEM  → 전역(시스템 관리자): ALL, ALL_ADMINS, USER
-- scope=ACADEMY → 학원(학원 관리자): ALL, ADMINS, DIRECTORS, TEACHERS, USER
-- ============================================================

CREATE TABLE IF NOT EXISTS ium_notification_template (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    template_key  VARCHAR(80)  NOT NULL COMMENT '코드(고유)',
    title         VARCHAR(500) NOT NULL,
    body          TEXT         NOT NULL,
    is_active     CHAR(1)      NOT NULL DEFAULT 'Y' COMMENT 'Y/N',
    del_yn        CHAR(1)      NOT NULL DEFAULT 'N' COMMENT 'Y/N',
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_notif_tpl_key (template_key),
    INDEX idx_active (is_active, del_yn)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='알림 문구(템플릿) 관리';

CREATE TABLE IF NOT EXISTS ium_notifications (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    scope            VARCHAR(20)  NOT NULL DEFAULT 'SYSTEM' COMMENT 'SYSTEM / ACADEMY',
    academy_id       BIGINT NULL COMMENT 'ACADEMY 일 때 FK ium_academies.id',
    template_id      BIGINT NULL,
    title            VARCHAR(500) NOT NULL,
    body             TEXT         NOT NULL,
    audience         VARCHAR(30)  NOT NULL COMMENT '범위별 허용값 상이',
    target_user_id   BIGINT NULL,
    sender_user_id   BIGINT NULL,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_scope_academy (scope, academy_id, created_at),
    INDEX idx_audience (audience),
    INDEX idx_target (target_user_id),
    INDEX idx_tpl (template_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='발송된 알림';

CREATE TABLE IF NOT EXISTS ium_notification_read (
    notification_id BIGINT NOT NULL,
    user_id         BIGINT NOT NULL,
    read_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (notification_id, user_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO ium_notification_template (template_key, title, body, is_active, del_yn) VALUES
('GENERAL_INFO', '일반 안내', '안내 내용을 이곳에 입력하세요.', 'Y', 'N'),
('SYSTEM_TEST', '시스템', '시스템 알림 테스트입니다.', 'Y', 'N');

DROP PROCEDURE IF EXISTS sp_notif_template_list;
DROP PROCEDURE IF EXISTS sp_notif_template_save;
DROP PROCEDURE IF EXISTS sp_notif_send;
DROP PROCEDURE IF EXISTS sp_notif_send_from_template_key;
DROP PROCEDURE IF EXISTS sp_notif_list_for_user;
DROP PROCEDURE IF EXISTS sp_notif_unread_count;
DROP PROCEDURE IF EXISTS sp_notif_mark_read;
DROP PROCEDURE IF EXISTS sp_notif_mark_all_read;

DELIMITER $$

CREATE PROCEDURE sp_notif_template_list()
BEGIN
    SELECT
        t.id,
        t.template_key  AS templateKey,
        t.title,
        t.body,
        t.is_active     AS isActive,
        t.created_at    AS createdAt,
        t.updated_at    AS updatedAt
    FROM ium_notification_template t
    WHERE t.del_yn = 'N'
    ORDER BY t.template_key;
END$$

CREATE PROCEDURE sp_notif_template_save(
    IN p_template_key VARCHAR(80),
    IN p_title VARCHAR(500),
    IN p_body TEXT
)
BEGIN
    INSERT INTO ium_notification_template (template_key, title, body)
    VALUES (p_template_key, p_title, p_body)
    ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        body = VALUES(body),
        updated_at = CURRENT_TIMESTAMP,
        del_yn = 'N';
    SELECT
        t.id,
        t.template_key AS templateKey,
        t.title,
        t.body
    FROM ium_notification_template t
    WHERE t.template_key = p_template_key;
END$$

CREATE PROCEDURE sp_notif_send(
    IN p_scope VARCHAR(20),
    IN p_academy_id BIGINT,
    IN p_title VARCHAR(500),
    IN p_body TEXT,
    IN p_audience VARCHAR(30),
    IN p_target_user_id BIGINT,
    IN p_sender_user_id BIGINT,
    IN p_template_id BIGINT
)
BEGIN
    DECLARE v_ta BIGINT DEFAULT NULL;

    IF p_scope NOT IN ('SYSTEM', 'ACADEMY') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_SCOPE';
    END IF;

    IF p_scope = 'SYSTEM' AND p_academy_id IS NOT NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SYSTEM_NO_ACADEMY';
    END IF;

    IF p_scope = 'ACADEMY' AND (p_academy_id IS NULL OR p_academy_id <= 0) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ACADEMY_REQUIRES_ID';
    END IF;

    IF p_audience = 'USER' AND (p_target_user_id IS NULL OR p_target_user_id <= 0) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'USER_AUDIENCE_REQUIRES_TARGET';
    END IF;

    IF p_scope = 'SYSTEM' AND p_audience NOT IN ('ALL', 'ALL_ADMINS', 'USER') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_SYSTEM_AUDIENCE';
    END IF;

    IF p_scope = 'ACADEMY' AND p_audience NOT IN ('ALL', 'ADMINS', 'DIRECTORS', 'TEACHERS', 'USER') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_ACADEMY_AUDIENCE';
    END IF;

    IF p_scope = 'ACADEMY' AND p_audience = 'USER' AND p_target_user_id > 0 THEN
        SELECT u.academy_id INTO v_ta FROM ium_users u
        WHERE u.id = p_target_user_id AND u.del_yn = 'N' LIMIT 1;
        IF v_ta IS NULL OR v_ta <> p_academy_id THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'TARGET_NOT_IN_ACADEMY';
        END IF;
    END IF;

    INSERT INTO ium_notifications (
        scope, academy_id, template_id, title, body, audience, target_user_id, sender_user_id
    ) VALUES (
        p_scope,
        IF(p_scope = 'ACADEMY', p_academy_id, NULL),
        p_template_id,
        p_title,
        p_body,
        p_audience,
        IF(p_audience = 'USER', p_target_user_id, NULL),
        p_sender_user_id
    );

    SELECT LAST_INSERT_ID() AS id;
END$$

CREATE PROCEDURE sp_notif_send_from_template_key(
    IN p_template_key VARCHAR(80),
    IN p_scope VARCHAR(20),
    IN p_academy_id BIGINT,
    IN p_audience VARCHAR(30),
    IN p_target_user_id BIGINT,
    IN p_sender_user_id BIGINT
)
BEGIN
    DECLARE v_tid BIGINT DEFAULT NULL;
    DECLARE v_title VARCHAR(500);
    DECLARE v_body TEXT;
    DECLARE v_ta BIGINT DEFAULT NULL;

    SELECT t.id, t.title, t.body INTO v_tid, v_title, v_body
    FROM ium_notification_template t
    WHERE t.template_key = p_template_key AND t.del_yn = 'N' AND t.is_active = 'Y'
    LIMIT 1;

    IF v_tid IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'TEMPLATE_NOT_FOUND';
    END IF;

    IF p_scope NOT IN ('SYSTEM', 'ACADEMY') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_SCOPE';
    END IF;
    IF p_scope = 'SYSTEM' AND p_academy_id IS NOT NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SYSTEM_NO_ACADEMY';
    END IF;
    IF p_scope = 'ACADEMY' AND (p_academy_id IS NULL OR p_academy_id <= 0) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ACADEMY_REQUIRES_ID';
    END IF;
    IF p_audience = 'USER' AND (p_target_user_id IS NULL OR p_target_user_id <= 0) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'USER_AUDIENCE_REQUIRES_TARGET';
    END IF;
    IF p_scope = 'SYSTEM' AND p_audience NOT IN ('ALL', 'ALL_ADMINS', 'USER') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_SYSTEM_AUDIENCE';
    END IF;
    IF p_scope = 'ACADEMY' AND p_audience NOT IN ('ALL', 'ADMINS', 'DIRECTORS', 'TEACHERS', 'USER') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_ACADEMY_AUDIENCE';
    END IF;
    IF p_scope = 'ACADEMY' AND p_audience = 'USER' AND p_target_user_id > 0 THEN
        SELECT u.academy_id INTO v_ta FROM ium_users u
        WHERE u.id = p_target_user_id AND u.del_yn = 'N' LIMIT 1;
        IF v_ta IS NULL OR v_ta <> p_academy_id THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'TARGET_NOT_IN_ACADEMY';
        END IF;
    END IF;

    INSERT INTO ium_notifications (
        scope, academy_id, template_id, title, body, audience, target_user_id, sender_user_id
    ) VALUES (
        p_scope,
        IF(p_scope = 'ACADEMY', p_academy_id, NULL),
        v_tid,
        v_title,
        v_body,
        p_audience,
        IF(p_audience = 'USER', p_target_user_id, NULL),
        p_sender_user_id
    );

    SELECT LAST_INSERT_ID() AS id;
END$$

CREATE PROCEDURE sp_notif_list_for_user(
    IN p_user_id BIGINT,
    IN p_user_grade VARCHAR(20),
    IN p_user_level VARCHAR(20),
    IN p_user_academy_id BIGINT,
    IN p_limit INT
)
BEGIN
    SELECT
        n.id,
        n.scope,
        n.academy_id AS academyId,
        a.name       AS academyName,
        n.title,
        n.body,
        n.audience,
        n.created_at AS createdAt,
        CASE WHEN r.user_id IS NOT NULL THEN 1 ELSE 0 END AS isRead
    FROM ium_notifications n
    LEFT JOIN ium_academies a ON n.scope = 'ACADEMY' AND a.id = n.academy_id
    LEFT JOIN ium_notification_read r
        ON r.notification_id = n.id AND r.user_id = p_user_id
    WHERE
        (
            n.scope = 'SYSTEM'
            AND n.academy_id IS NULL
            AND (
                n.audience = 'ALL'
                OR (n.audience = 'ALL_ADMINS' AND p_user_grade = 'ADMIN')
                OR (n.audience = 'USER' AND n.target_user_id = p_user_id)
            )
        )
        OR
        (
            n.scope = 'ACADEMY'
            AND n.academy_id IS NOT NULL
            AND p_user_academy_id IS NOT NULL
            AND n.academy_id = p_user_academy_id
            AND (
                n.audience = 'ALL'
                OR (n.audience = 'ADMINS' AND p_user_grade = 'ADMIN')
                OR (n.audience = 'DIRECTORS' AND p_user_level = 'DIRECTOR')
                OR (n.audience = 'TEACHERS' AND p_user_level = 'TEACHER')
                OR (n.audience = 'USER' AND n.target_user_id = p_user_id)
            )
        )
    ORDER BY n.created_at DESC
    LIMIT p_limit;
END$$

CREATE PROCEDURE sp_notif_unread_count(
    IN p_user_id BIGINT,
    IN p_user_grade VARCHAR(20),
    IN p_user_level VARCHAR(20),
    IN p_user_academy_id BIGINT
)
BEGIN
    SELECT COUNT(*) AS cnt
    FROM ium_notifications n
    LEFT JOIN ium_notification_read r
        ON r.notification_id = n.id AND r.user_id = p_user_id
    WHERE r.user_id IS NULL
      AND (
        (
            n.scope = 'SYSTEM'
            AND n.academy_id IS NULL
            AND (
                n.audience = 'ALL'
                OR (n.audience = 'ALL_ADMINS' AND p_user_grade = 'ADMIN')
                OR (n.audience = 'USER' AND n.target_user_id = p_user_id)
            )
        )
        OR
        (
            n.scope = 'ACADEMY'
            AND n.academy_id IS NOT NULL
            AND p_user_academy_id IS NOT NULL
            AND n.academy_id = p_user_academy_id
            AND (
                n.audience = 'ALL'
                OR (n.audience = 'ADMINS' AND p_user_grade = 'ADMIN')
                OR (n.audience = 'DIRECTORS' AND p_user_level = 'DIRECTOR')
                OR (n.audience = 'TEACHERS' AND p_user_level = 'TEACHER')
                OR (n.audience = 'USER' AND n.target_user_id = p_user_id)
            )
        )
      );
END$$

CREATE PROCEDURE sp_notif_mark_read(
    IN p_notification_id BIGINT,
    IN p_user_id BIGINT
)
BEGIN
    INSERT IGNORE INTO ium_notification_read (notification_id, user_id)
    VALUES (p_notification_id, p_user_id);
END$$

CREATE PROCEDURE sp_notif_mark_all_read(
    IN p_user_id BIGINT,
    IN p_user_grade VARCHAR(20),
    IN p_user_level VARCHAR(20),
    IN p_user_academy_id BIGINT
)
BEGIN
    INSERT IGNORE INTO ium_notification_read (notification_id, user_id)
    SELECT n.id, p_user_id
    FROM ium_notifications n
    LEFT JOIN ium_notification_read r
        ON r.notification_id = n.id AND r.user_id = p_user_id
    WHERE r.user_id IS NULL
      AND (
        (
            n.scope = 'SYSTEM'
            AND n.academy_id IS NULL
            AND (
                n.audience = 'ALL'
                OR (n.audience = 'ALL_ADMINS' AND p_user_grade = 'ADMIN')
                OR (n.audience = 'USER' AND n.target_user_id = p_user_id)
            )
        )
        OR
        (
            n.scope = 'ACADEMY'
            AND n.academy_id IS NOT NULL
            AND p_user_academy_id IS NOT NULL
            AND n.academy_id = p_user_academy_id
            AND (
                n.audience = 'ALL'
                OR (n.audience = 'ADMINS' AND p_user_grade = 'ADMIN')
                OR (n.audience = 'DIRECTORS' AND p_user_level = 'DIRECTOR')
                OR (n.audience = 'TEACHERS' AND p_user_level = 'TEACHER')
                OR (n.audience = 'USER' AND n.target_user_id = p_user_id)
            )
        )
      );
END$$

DELIMITER ;

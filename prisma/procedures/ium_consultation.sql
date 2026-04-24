-- ============================================================
-- 이음(I-UM) 상담(Consultation) 관리 테이블 및 프로시저
-- 기획서 항목 [1-1] 상담 관리 / [1-2] 상담 카드 / P1-1 퍼널
-- 선행: ium_academies, ium_students
-- 연계: 상태가 CONVERTED 로 전환되면 ium_students 자동 생성
-- ============================================================

-- 1) 상담 카드
CREATE TABLE IF NOT EXISTS ium_consultation (
    id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
    academy_id         BIGINT       NOT NULL COMMENT '소속 학원 FK',
    source             VARCHAR(20)  NOT NULL DEFAULT 'PHONE'
                       COMMENT 'PHONE/WEB/VISIT/SNS/REFERRAL/OTHER',
    contact_name       VARCHAR(100) NOT NULL COMMENT '신청자(대개 보호자)',
    contact_phone      VARCHAR(30)  NULL,
    student_name       VARCHAR(100) NOT NULL COMMENT '상담 대상 학생명',
    grade              VARCHAR(20)  NULL COMMENT '예: 중2, 고1',
    subject            VARCHAR(50)  NULL COMMENT '희망 과목',
    prefer_schedule    VARCHAR(200) NULL COMMENT '희망 일정(자유 입력)',
    memo               TEXT         NULL COMMENT '상담 본문/요청사항',
    status             VARCHAR(20)  NOT NULL DEFAULT 'NEW'
                       COMMENT 'NEW/IN_PROGRESS/WAIT/CONVERTED/LOST',
    counselor_user_id  BIGINT       NULL COMMENT '담당 상담자(ium_users.id)',
    converted_student_id BIGINT     NULL COMMENT 'CONVERTED 시 생성된 학생 FK',
    requested_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                       COMMENT '접수 일시',
    resolved_at        DATETIME     NULL COMMENT 'CONVERTED/LOST 시각',
    created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    del_yn             CHAR(1)      NOT NULL DEFAULT 'N',
    INDEX idx_academy_status (academy_id, status, del_yn),
    INDEX idx_requested_at (requested_at DESC),
    INDEX idx_student_name (student_name),
    CONSTRAINT fk_ium_consult_academy
        FOREIGN KEY (academy_id) REFERENCES ium_academies (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_ium_consult_student
        FOREIGN KEY (converted_student_id) REFERENCES ium_students (id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='이음 상담 카드';

-- 2) 상담 상태 전이 로그
CREATE TABLE IF NOT EXISTS ium_consultation_log (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    consultation_id BIGINT       NOT NULL,
    old_status     VARCHAR(20)  NULL,
    new_status     VARCHAR(20)  NOT NULL,
    note           VARCHAR(500) NULL,
    user_id        BIGINT       NULL COMMENT '처리자(ium_users.id)',
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_consult (consultation_id, created_at DESC),
    CONSTRAINT fk_ium_consult_log_consult
        FOREIGN KEY (consultation_id) REFERENCES ium_consultation (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='상담 상태 전이 로그';

-- ------------------------------------------------------------
-- 프로시저 — 갱신 안전을 위해 DROP 후 CREATE
-- ------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_ium_consult_list;
DROP PROCEDURE IF EXISTS sp_ium_consult_list_for_academy;
DROP PROCEDURE IF EXISTS sp_ium_consult_get;
DROP PROCEDURE IF EXISTS sp_ium_consult_create;
DROP PROCEDURE IF EXISTS sp_ium_consult_update;
DROP PROCEDURE IF EXISTS sp_ium_consult_set_status;
DROP PROCEDURE IF EXISTS sp_ium_consult_add_log;
DROP PROCEDURE IF EXISTS sp_ium_consult_list_logs;
DROP PROCEDURE IF EXISTS sp_ium_consult_convert_to_student;
DROP PROCEDURE IF EXISTS sp_ium_consult_delete;
DROP PROCEDURE IF EXISTS sp_ium_consult_stats;

DELIMITER $$

-- 전역 관리자: 전체 학원
CREATE PROCEDURE sp_ium_consult_list(
    IN p_status  VARCHAR(20),
    IN p_keyword VARCHAR(100)
)
BEGIN
    SELECT
        c.id,
        c.academy_id   AS academyId,
        a.name         AS academyName,
        c.source,
        c.contact_name AS contactName,
        c.contact_phone AS contactPhone,
        c.student_name AS studentName,
        c.grade,
        c.subject,
        c.prefer_schedule AS preferSchedule,
        c.status,
        c.counselor_user_id AS counselorUserId,
        u.name          AS counselorName,
        c.converted_student_id AS convertedStudentId,
        c.requested_at  AS requestedAt,
        c.resolved_at   AS resolvedAt,
        c.created_at    AS createdAt,
        c.updated_at    AS updatedAt
    FROM ium_consultation c
    LEFT JOIN ium_academies a ON a.id = c.academy_id
    LEFT JOIN ium_users u     ON u.id = c.counselor_user_id
    WHERE c.del_yn = 'N'
      AND (p_status IS NULL OR p_status = '' OR c.status = p_status)
      AND (p_keyword IS NULL OR p_keyword = ''
           OR c.student_name LIKE CONCAT('%', p_keyword, '%')
           OR c.contact_name LIKE CONCAT('%', p_keyword, '%')
           OR c.contact_phone LIKE CONCAT('%', p_keyword, '%')
           OR c.subject LIKE CONCAT('%', p_keyword, '%'))
    ORDER BY
        FIELD(c.status, 'NEW','IN_PROGRESS','WAIT','CONVERTED','LOST'),
        c.requested_at DESC;
END$$

-- 학원 관리자: 자기 학원만
CREATE PROCEDURE sp_ium_consult_list_for_academy(
    IN p_academy_id BIGINT,
    IN p_status     VARCHAR(20),
    IN p_keyword    VARCHAR(100)
)
BEGIN
    SELECT
        c.id,
        c.academy_id   AS academyId,
        a.name         AS academyName,
        c.source,
        c.contact_name AS contactName,
        c.contact_phone AS contactPhone,
        c.student_name AS studentName,
        c.grade,
        c.subject,
        c.prefer_schedule AS preferSchedule,
        c.status,
        c.counselor_user_id AS counselorUserId,
        u.name          AS counselorName,
        c.converted_student_id AS convertedStudentId,
        c.requested_at  AS requestedAt,
        c.resolved_at   AS resolvedAt,
        c.created_at    AS createdAt,
        c.updated_at    AS updatedAt
    FROM ium_consultation c
    LEFT JOIN ium_academies a ON a.id = c.academy_id
    LEFT JOIN ium_users u     ON u.id = c.counselor_user_id
    WHERE c.del_yn = 'N'
      AND c.academy_id = p_academy_id
      AND (p_status IS NULL OR p_status = '' OR c.status = p_status)
      AND (p_keyword IS NULL OR p_keyword = ''
           OR c.student_name LIKE CONCAT('%', p_keyword, '%')
           OR c.contact_name LIKE CONCAT('%', p_keyword, '%')
           OR c.contact_phone LIKE CONCAT('%', p_keyword, '%')
           OR c.subject LIKE CONCAT('%', p_keyword, '%'))
    ORDER BY
        FIELD(c.status, 'NEW','IN_PROGRESS','WAIT','CONVERTED','LOST'),
        c.requested_at DESC;
END$$

CREATE PROCEDURE sp_ium_consult_get(
    IN p_id BIGINT
)
BEGIN
    SELECT
        c.id,
        c.academy_id   AS academyId,
        a.name         AS academyName,
        c.source,
        c.contact_name AS contactName,
        c.contact_phone AS contactPhone,
        c.student_name AS studentName,
        c.grade,
        c.subject,
        c.prefer_schedule AS preferSchedule,
        c.memo,
        c.status,
        c.counselor_user_id AS counselorUserId,
        u.name          AS counselorName,
        c.converted_student_id AS convertedStudentId,
        c.requested_at  AS requestedAt,
        c.resolved_at   AS resolvedAt,
        c.created_at    AS createdAt,
        c.updated_at    AS updatedAt
    FROM ium_consultation c
    LEFT JOIN ium_academies a ON a.id = c.academy_id
    LEFT JOIN ium_users u     ON u.id = c.counselor_user_id
    WHERE c.id = p_id AND c.del_yn = 'N';
END$$

-- 접수 등록 — 상태 NEW 로 시작, 로그 기록
CREATE PROCEDURE sp_ium_consult_create(
    IN p_academy_id      BIGINT,
    IN p_source          VARCHAR(20),
    IN p_contact_name    VARCHAR(100),
    IN p_contact_phone   VARCHAR(30),
    IN p_student_name    VARCHAR(100),
    IN p_grade           VARCHAR(20),
    IN p_subject         VARCHAR(50),
    IN p_prefer_schedule VARCHAR(200),
    IN p_memo            TEXT,
    IN p_counselor_user_id BIGINT,
    IN p_requested_at    DATETIME,
    IN p_user_id         BIGINT
)
BEGIN
    DECLARE v_id BIGINT DEFAULT 0;
    DECLARE v_ac INT DEFAULT 0;

    IF p_academy_id IS NULL OR p_academy_id <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ACADEMY_REQUIRED';
    END IF;

    SELECT COUNT(*) INTO v_ac FROM ium_academies WHERE id = p_academy_id AND is_active = 'Y';
    IF v_ac = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_ACADEMY';
    END IF;

    IF p_student_name IS NULL OR TRIM(p_student_name) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'STUDENT_NAME_REQUIRED';
    END IF;
    IF p_contact_name IS NULL OR TRIM(p_contact_name) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CONTACT_NAME_REQUIRED';
    END IF;

    INSERT INTO ium_consultation
        (academy_id, source, contact_name, contact_phone,
         student_name, grade, subject, prefer_schedule, memo,
         status, counselor_user_id, requested_at)
    VALUES
        (p_academy_id,
         IFNULL(NULLIF(p_source, ''), 'PHONE'),
         TRIM(p_contact_name),
         NULLIF(TRIM(p_contact_phone), ''),
         TRIM(p_student_name),
         NULLIF(TRIM(p_grade), ''),
         NULLIF(TRIM(p_subject), ''),
         NULLIF(TRIM(p_prefer_schedule), ''),
         NULLIF(p_memo, ''),
         'NEW',
         NULLIF(p_counselor_user_id, 0),
         COALESCE(p_requested_at, CURRENT_TIMESTAMP));

    SET v_id = LAST_INSERT_ID();

    INSERT INTO ium_consultation_log
        (consultation_id, old_status, new_status, note, user_id)
    VALUES
        (v_id, NULL, 'NEW', '상담 접수', NULLIF(p_user_id, 0));

    SELECT v_id AS id;
END$$

-- 내용/담당자 업데이트 (상태 제외)
CREATE PROCEDURE sp_ium_consult_update(
    IN p_id              BIGINT,
    IN p_source          VARCHAR(20),
    IN p_contact_name    VARCHAR(100),
    IN p_contact_phone   VARCHAR(30),
    IN p_student_name    VARCHAR(100),
    IN p_grade           VARCHAR(20),
    IN p_subject         VARCHAR(50),
    IN p_prefer_schedule VARCHAR(200),
    IN p_memo            TEXT,
    IN p_counselor_user_id BIGINT,
    IN p_requested_at    DATETIME
)
BEGIN
    IF p_student_name IS NULL OR TRIM(p_student_name) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'STUDENT_NAME_REQUIRED';
    END IF;

    UPDATE ium_consultation
       SET source             = IFNULL(NULLIF(p_source, ''), source),
           contact_name       = TRIM(p_contact_name),
           contact_phone      = NULLIF(TRIM(p_contact_phone), ''),
           student_name       = TRIM(p_student_name),
           grade              = NULLIF(TRIM(p_grade), ''),
           subject            = NULLIF(TRIM(p_subject), ''),
           prefer_schedule    = NULLIF(TRIM(p_prefer_schedule), ''),
           memo               = NULLIF(p_memo, ''),
           counselor_user_id  = NULLIF(p_counselor_user_id, 0),
           requested_at       = COALESCE(p_requested_at, requested_at)
     WHERE id = p_id AND del_yn = 'N';

    SELECT ROW_COUNT() AS affected;
END$$

-- 상태 전이 + 로그
-- CONVERTED/LOST 로 전이 시 resolved_at 자동 기록
CREATE PROCEDURE sp_ium_consult_set_status(
    IN p_id      BIGINT,
    IN p_status  VARCHAR(20),
    IN p_note    VARCHAR(500),
    IN p_user_id BIGINT
)
BEGIN
    DECLARE v_prev VARCHAR(20) DEFAULT NULL;

    IF p_status NOT IN ('NEW','IN_PROGRESS','WAIT','CONVERTED','LOST') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_STATUS';
    END IF;

    SELECT status INTO v_prev FROM ium_consultation
     WHERE id = p_id AND del_yn = 'N';

    IF v_prev IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CONSULT_NOT_FOUND';
    END IF;

    UPDATE ium_consultation
       SET status      = p_status,
           resolved_at = IF(p_status IN ('CONVERTED','LOST'), COALESCE(resolved_at, CURRENT_TIMESTAMP), NULL)
     WHERE id = p_id AND del_yn = 'N';

    INSERT INTO ium_consultation_log
        (consultation_id, old_status, new_status, note, user_id)
    VALUES
        (p_id, v_prev, p_status, NULLIF(TRIM(p_note), ''), NULLIF(p_user_id, 0));

    SELECT ROW_COUNT() AS affected;
END$$

-- 상담 코멘트 로그 추가 (상태 유지)
CREATE PROCEDURE sp_ium_consult_add_log(
    IN p_id      BIGINT,
    IN p_note    VARCHAR(500),
    IN p_user_id BIGINT
)
BEGIN
    DECLARE v_status VARCHAR(20) DEFAULT NULL;

    SELECT status INTO v_status FROM ium_consultation
     WHERE id = p_id AND del_yn = 'N';

    IF v_status IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CONSULT_NOT_FOUND';
    END IF;

    IF p_note IS NULL OR TRIM(p_note) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NOTE_REQUIRED';
    END IF;

    INSERT INTO ium_consultation_log
        (consultation_id, old_status, new_status, note, user_id)
    VALUES
        (p_id, v_status, v_status, TRIM(p_note), NULLIF(p_user_id, 0));

    SELECT LAST_INSERT_ID() AS id;
END$$

CREATE PROCEDURE sp_ium_consult_list_logs(
    IN p_id BIGINT
)
BEGIN
    SELECT
        l.id,
        l.consultation_id AS consultationId,
        l.old_status      AS oldStatus,
        l.new_status      AS newStatus,
        l.note,
        l.user_id         AS userId,
        u.name            AS userName,
        l.created_at      AS createdAt
    FROM ium_consultation_log l
    LEFT JOIN ium_users u ON u.id = l.user_id
    WHERE l.consultation_id = p_id
    ORDER BY l.created_at DESC;
END$$

-- CONVERTED 전이 + ium_students 자동 생성
-- 이미 converted_student_id 가 있으면 그대로 반환
CREATE PROCEDURE sp_ium_consult_convert_to_student(
    IN p_id         BIGINT,
    IN p_enrolled_at DATE,
    IN p_user_id    BIGINT
)
BEGIN
    DECLARE v_academy_id BIGINT DEFAULT NULL;
    DECLARE v_student_name VARCHAR(100) DEFAULT NULL;
    DECLARE v_grade VARCHAR(20) DEFAULT NULL;
    DECLARE v_contact_phone VARCHAR(30) DEFAULT NULL;
    DECLARE v_contact_name VARCHAR(100) DEFAULT NULL;
    DECLARE v_memo TEXT DEFAULT NULL;
    DECLARE v_prev VARCHAR(20) DEFAULT NULL;
    DECLARE v_existing_student BIGINT DEFAULT NULL;
    DECLARE v_new_student BIGINT DEFAULT 0;

    SELECT academy_id, student_name, grade, contact_phone, contact_name, memo, status,
           converted_student_id
      INTO v_academy_id, v_student_name, v_grade, v_contact_phone, v_contact_name, v_memo, v_prev,
           v_existing_student
      FROM ium_consultation
     WHERE id = p_id AND del_yn = 'N';

    IF v_academy_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CONSULT_NOT_FOUND';
    END IF;

    IF v_existing_student IS NOT NULL THEN
        -- 이미 전환된 상담 — 멱등 처리
        SELECT v_existing_student AS studentId,
               0 AS created;
    ELSE
        INSERT INTO ium_students
            (academy_id, name, grade, parent_phone, memo, status, enrolled_at)
        VALUES
            (v_academy_id, v_student_name,
             NULLIF(v_grade, ''),
             NULLIF(v_contact_phone, ''),
             NULLIF(v_memo, ''),
             'ACTIVE',
             p_enrolled_at);

        SET v_new_student = LAST_INSERT_ID();

        -- 상담자와 연락처가 있으면 보호자로 1건 등록 (대표로)
        IF v_contact_name IS NOT NULL AND TRIM(v_contact_name) <> '' THEN
            INSERT INTO ium_student_guardians
                (student_id, name, relation, phone, is_primary)
            VALUES
                (v_new_student, v_contact_name, '부모',
                 NULLIF(v_contact_phone, ''), 1);
        END IF;

        UPDATE ium_consultation
           SET status               = 'CONVERTED',
               converted_student_id = v_new_student,
               resolved_at          = COALESCE(resolved_at, CURRENT_TIMESTAMP)
         WHERE id = p_id;

        INSERT INTO ium_consultation_log
            (consultation_id, old_status, new_status, note, user_id)
        VALUES
            (p_id, v_prev, 'CONVERTED',
             CONCAT('학생 등록: id=', v_new_student),
             NULLIF(p_user_id, 0));

        SELECT v_new_student AS studentId,
               1 AS created;
    END IF;
END$$

CREATE PROCEDURE sp_ium_consult_delete(
    IN p_id BIGINT
)
BEGIN
    UPDATE ium_consultation SET del_yn = 'Y' WHERE id = p_id;
    SELECT ROW_COUNT() AS affected;
END$$

-- 대시보드 위젯용 요약 (퍼널 상태별 카운트)
--   p_academy_id IS NULL 이면 전체 학원
CREATE PROCEDURE sp_ium_consult_stats(
    IN p_academy_id BIGINT
)
BEGIN
    SELECT
        SUM(status = 'NEW')         AS newCount,
        SUM(status = 'IN_PROGRESS') AS inProgress,
        SUM(status = 'WAIT')        AS waiting,
        SUM(status = 'CONVERTED')   AS converted,
        SUM(status = 'LOST')        AS lost,
        COUNT(*)                    AS total,
        ROUND(
            100 * SUM(status = 'CONVERTED') /
            NULLIF(SUM(status IN ('CONVERTED','LOST')), 0),
            1
        ) AS conversionRate
      FROM ium_consultation
     WHERE del_yn = 'N'
       AND (p_academy_id IS NULL OR academy_id = p_academy_id);
END$$

DELIMITER ;

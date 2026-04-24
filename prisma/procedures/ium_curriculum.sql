-- ============================================================
-- 이음(I-UM) 커리큘럼(Curriculum) · 반 진도(Class Progress)
-- 기획서 항목 [2-2] 수업/진도 관리
-- 선행: ium_class
-- ============================================================

-- 1) 커리큘럼 마스터 — 과목/레벨/단원 순서
CREATE TABLE IF NOT EXISTS ium_curriculum (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    academy_id      BIGINT       NOT NULL COMMENT '소속 학원 FK',
    subject         VARCHAR(50)  NOT NULL,
    level           VARCHAR(20)  NULL,
    unit_no         INT          NOT NULL COMMENT '단원 번호',
    unit_title      VARCHAR(200) NOT NULL COMMENT '단원 제목',
    plan_memo       TEXT         NULL,
    est_week        INT          NULL COMMENT '예상 소요 주차',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    del_yn          CHAR(1)      NOT NULL DEFAULT 'N',
    UNIQUE KEY uq_curr (academy_id, subject, level, unit_no),
    INDEX idx_subject_level (academy_id, subject, level),
    CONSTRAINT fk_ium_curr_academy
        FOREIGN KEY (academy_id) REFERENCES ium_academies (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='이음 커리큘럼 마스터';

-- 2) 반별 진도 — 어떤 반이 어떤 단원을 언제 완료했는지
CREATE TABLE IF NOT EXISTS ium_class_progress (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    class_id         BIGINT       NOT NULL,
    curriculum_id    BIGINT       NOT NULL,
    completed_at     DATETIME     NULL COMMENT 'NULL=미완료, 값=완료일',
    note             VARCHAR(500) NULL,
    teacher_user_id  BIGINT       NULL,
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_class_curr (class_id, curriculum_id),
    INDEX idx_class (class_id, completed_at),
    CONSTRAINT fk_ium_prog_class
        FOREIGN KEY (class_id) REFERENCES ium_class (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ium_prog_curr
        FOREIGN KEY (curriculum_id) REFERENCES ium_curriculum (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='반별 단원 진도';

-- ------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_ium_curriculum_list;
DROP PROCEDURE IF EXISTS sp_ium_curriculum_upsert;
DROP PROCEDURE IF EXISTS sp_ium_curriculum_delete;
DROP PROCEDURE IF EXISTS sp_ium_class_progress_get;
DROP PROCEDURE IF EXISTS sp_ium_class_progress_mark;
DROP PROCEDURE IF EXISTS sp_ium_class_progress_stats;

DELIMITER $$

CREATE PROCEDURE sp_ium_curriculum_list(
    IN p_academy_id BIGINT,
    IN p_subject    VARCHAR(50),
    IN p_level      VARCHAR(20)
)
BEGIN
    SELECT
        c.id,
        c.academy_id AS academyId,
        c.subject,
        c.level,
        c.unit_no    AS unitNo,
        c.unit_title AS unitTitle,
        c.plan_memo  AS planMemo,
        c.est_week   AS estWeek,
        c.created_at AS createdAt,
        c.updated_at AS updatedAt
    FROM ium_curriculum c
    WHERE c.del_yn = 'N'
      AND c.academy_id = p_academy_id
      AND (p_subject IS NULL OR p_subject = '' OR c.subject = p_subject)
      AND (p_level IS NULL OR p_level = '' OR c.level = p_level OR c.level IS NULL)
    ORDER BY c.subject, c.level, c.unit_no;
END$$

CREATE PROCEDURE sp_ium_curriculum_upsert(
    IN p_id         BIGINT,
    IN p_academy_id BIGINT,
    IN p_subject    VARCHAR(50),
    IN p_level      VARCHAR(20),
    IN p_unit_no    INT,
    IN p_unit_title VARCHAR(200),
    IN p_plan_memo  TEXT,
    IN p_est_week   INT
)
BEGIN
    DECLARE v_id BIGINT DEFAULT 0;

    IF p_subject IS NULL OR TRIM(p_subject) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SUBJECT_REQUIRED';
    END IF;
    IF p_unit_title IS NULL OR TRIM(p_unit_title) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'UNIT_TITLE_REQUIRED';
    END IF;

    IF p_id IS NULL OR p_id = 0 THEN
        INSERT INTO ium_curriculum
            (academy_id, subject, level, unit_no, unit_title, plan_memo, est_week)
        VALUES
            (p_academy_id, TRIM(p_subject),
             NULLIF(TRIM(p_level), ''),
             IFNULL(p_unit_no, 0),
             TRIM(p_unit_title),
             NULLIF(p_plan_memo, ''),
             p_est_week);
        SET v_id = LAST_INSERT_ID();
    ELSE
        UPDATE ium_curriculum
           SET subject    = TRIM(p_subject),
               level      = NULLIF(TRIM(p_level), ''),
               unit_no    = IFNULL(p_unit_no, unit_no),
               unit_title = TRIM(p_unit_title),
               plan_memo  = NULLIF(p_plan_memo, ''),
               est_week   = p_est_week
         WHERE id = p_id AND del_yn = 'N';
        SET v_id = p_id;
    END IF;

    SELECT v_id AS id;
END$$

CREATE PROCEDURE sp_ium_curriculum_delete(
    IN p_id BIGINT
)
BEGIN
    UPDATE ium_curriculum SET del_yn = 'Y' WHERE id = p_id;
    SELECT ROW_COUNT() AS affected;
END$$

-- 반별 진도 조회 — 반의 과목/레벨 기준으로 커리큘럼을 LEFT JOIN
CREATE PROCEDURE sp_ium_class_progress_get(
    IN p_class_id BIGINT
)
BEGIN
    DECLARE v_academy BIGINT DEFAULT 0;
    DECLARE v_subject VARCHAR(50) DEFAULT NULL;
    DECLARE v_level   VARCHAR(20) DEFAULT NULL;

    SELECT academy_id, subject, level
      INTO v_academy, v_subject, v_level
      FROM ium_class
     WHERE id = p_class_id AND del_yn = 'N';

    IF v_academy = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CLASS_NOT_FOUND';
    END IF;

    SELECT
        cu.id           AS curriculumId,
        cu.subject,
        cu.level,
        cu.unit_no      AS unitNo,
        cu.unit_title   AS unitTitle,
        cu.plan_memo    AS planMemo,
        cu.est_week     AS estWeek,
        p.id            AS progressId,
        p.completed_at  AS completedAt,
        p.note          AS progressNote,
        p.teacher_user_id AS teacherUserId,
        u.name          AS teacherName
    FROM ium_curriculum cu
    LEFT JOIN ium_class_progress p
           ON p.curriculum_id = cu.id
          AND p.class_id = p_class_id
    LEFT JOIN ium_users u ON u.id = p.teacher_user_id
    WHERE cu.del_yn = 'N'
      AND cu.academy_id = v_academy
      AND cu.subject = v_subject
      AND (v_level IS NULL OR cu.level IS NULL OR cu.level = v_level)
    ORDER BY cu.unit_no;
END$$

-- 진도 마킹 (토글) — completed=1 완료, 0 미완료로 취소
CREATE PROCEDURE sp_ium_class_progress_mark(
    IN p_class_id       BIGINT,
    IN p_curriculum_id  BIGINT,
    IN p_completed      TINYINT,
    IN p_note           VARCHAR(500),
    IN p_teacher_user_id BIGINT
)
BEGIN
    INSERT INTO ium_class_progress
        (class_id, curriculum_id, completed_at, note, teacher_user_id)
    VALUES
        (p_class_id, p_curriculum_id,
         IF(p_completed = 1, CURRENT_TIMESTAMP, NULL),
         NULLIF(TRIM(p_note), ''),
         NULLIF(p_teacher_user_id, 0))
    ON DUPLICATE KEY UPDATE
         completed_at    = IF(p_completed = 1, COALESCE(ium_class_progress.completed_at, CURRENT_TIMESTAMP), NULL),
         note            = IFNULL(NULLIF(TRIM(p_note), ''), ium_class_progress.note),
         teacher_user_id = IFNULL(NULLIF(p_teacher_user_id, 0), ium_class_progress.teacher_user_id);

    SELECT p.id, p.completed_at AS completedAt
      FROM ium_class_progress p
     WHERE p.class_id = p_class_id AND p.curriculum_id = p_curriculum_id;
END$$

-- 반별 진도 통계
CREATE PROCEDURE sp_ium_class_progress_stats(
    IN p_class_id BIGINT
)
BEGIN
    DECLARE v_academy BIGINT DEFAULT 0;
    DECLARE v_subject VARCHAR(50) DEFAULT NULL;
    DECLARE v_level   VARCHAR(20) DEFAULT NULL;
    DECLARE v_total INT DEFAULT 0;

    SELECT academy_id, subject, level
      INTO v_academy, v_subject, v_level
      FROM ium_class
     WHERE id = p_class_id AND del_yn = 'N';

    SELECT COUNT(*) INTO v_total
      FROM ium_curriculum cu
     WHERE cu.del_yn = 'N'
       AND cu.academy_id = v_academy
       AND cu.subject = v_subject
       AND (v_level IS NULL OR cu.level IS NULL OR cu.level = v_level);

    SELECT
        v_total AS totalUnits,
        COALESCE(SUM(p.completed_at IS NOT NULL), 0) AS completedUnits,
        ROUND(
            100 * COALESCE(SUM(p.completed_at IS NOT NULL), 0) /
            NULLIF(v_total, 0),
            1
        ) AS progressRate
      FROM ium_curriculum cu
      LEFT JOIN ium_class_progress p
             ON p.curriculum_id = cu.id
            AND p.class_id = p_class_id
     WHERE cu.del_yn = 'N'
       AND cu.academy_id = v_academy
       AND cu.subject = v_subject
       AND (v_level IS NULL OR cu.level IS NULL OR cu.level = v_level);
END$$

DELIMITER ;

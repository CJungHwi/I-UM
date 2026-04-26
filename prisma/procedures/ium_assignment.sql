-- ============================================================
-- 이음(I-UM) 과제(Assignment) · 제출(Submission)
-- 기획서 항목 [2-3] 과제 관리
-- 선행: ium_class, ium_class_enrollment, ium_students, ium_curriculum, gamification.sql
-- 게이미피케이션 자동 연동:
--   * 제출 상태가 'DONE' AND 점수 >= 90 이면 최초 1회 sp_gami_trigger_assignment_a (+50p) 호출
-- ============================================================

-- 1) 과제 본문
CREATE TABLE IF NOT EXISTS ium_assignment (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    class_id         BIGINT       NOT NULL,
    curriculum_id    BIGINT       NULL COMMENT '단원 FK (선택)',
    title            VARCHAR(200) NOT NULL,
    body             TEXT         NULL,
    due_at           DATETIME     NULL,
    created_by_user_id BIGINT     NULL,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    del_yn           CHAR(1)      NOT NULL DEFAULT 'N',
    INDEX idx_class_due (class_id, due_at),
    CONSTRAINT fk_ium_asg_class
        FOREIGN KEY (class_id) REFERENCES ium_class (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ium_asg_curr
        FOREIGN KEY (curriculum_id) REFERENCES ium_curriculum (id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='이음 과제';

-- 2) 과제 제출 (학생 × 과제)
CREATE TABLE IF NOT EXISTS ium_assignment_submission (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    assignment_id  BIGINT       NOT NULL,
    student_id     BIGINT       NOT NULL,
    status         VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                   COMMENT 'PENDING/DONE/LATE/MISSING',
    submitted_at   DATETIME     NULL,
    score          INT          NULL COMMENT '0~100',
    feedback       VARCHAR(500) NULL,
    graded_at      DATETIME     NULL,
    grader_user_id BIGINT       NULL,
    a_point_earned TINYINT(1)   NOT NULL DEFAULT 0 COMMENT 'A(90+) 포인트 적립 여부',
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_asg_student (assignment_id, student_id),
    INDEX idx_student (student_id, status),
    CONSTRAINT fk_ium_sub_asg
        FOREIGN KEY (assignment_id) REFERENCES ium_assignment (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ium_sub_student
        FOREIGN KEY (student_id) REFERENCES ium_students (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='이음 과제 제출';

-- ------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_ium_assignment_list_by_class;
DROP PROCEDURE IF EXISTS sp_ium_assignment_get;
DROP PROCEDURE IF EXISTS sp_ium_assignment_create;
DROP PROCEDURE IF EXISTS sp_ium_assignment_update;
DROP PROCEDURE IF EXISTS sp_ium_assignment_delete;
DROP PROCEDURE IF EXISTS sp_ium_assignment_submissions_get;
DROP PROCEDURE IF EXISTS sp_ium_assignment_submission_upsert;
DROP PROCEDURE IF EXISTS sp_ium_assignment_stats_by_student;
DROP PROCEDURE IF EXISTS sp_ium_assignment_auto_mark_missing;

DELIMITER $$

-- 반의 과제 목록 + 각 과제별 제출 요약
CREATE PROCEDURE sp_ium_assignment_list_by_class(
    IN p_class_id BIGINT
)
BEGIN
    SELECT
        a.id,
        a.class_id        AS classId,
        a.curriculum_id   AS curriculumId,
        cu.unit_title     AS unitTitle,
        a.title,
        a.body,
        a.due_at          AS dueAt,
        a.created_by_user_id AS createdByUserId,
        u.name            AS createdByName,
        a.created_at      AS createdAt,
        a.updated_at      AS updatedAt,
        (SELECT COUNT(*) FROM ium_assignment_submission s
          WHERE s.assignment_id = a.id AND s.status = 'DONE') AS doneCount,
        (SELECT COUNT(*) FROM ium_assignment_submission s
          WHERE s.assignment_id = a.id AND s.status = 'LATE') AS lateCount,
        (SELECT COUNT(*) FROM ium_assignment_submission s
          WHERE s.assignment_id = a.id AND s.status = 'MISSING') AS missingCount,
        (SELECT COUNT(*) FROM ium_assignment_submission s
          WHERE s.assignment_id = a.id AND s.status = 'PENDING') AS pendingCount,
        (SELECT COUNT(*) FROM ium_class_enrollment e
          WHERE e.class_id = a.class_id AND e.status = 'ACTIVE') AS totalStudents
    FROM ium_assignment a
    LEFT JOIN ium_curriculum cu ON cu.id = a.curriculum_id
    LEFT JOIN ium_users u ON u.id = a.created_by_user_id
    WHERE a.class_id = p_class_id
      AND a.del_yn = 'N'
    ORDER BY COALESCE(a.due_at, a.created_at) DESC;
END$$

CREATE PROCEDURE sp_ium_assignment_get(
    IN p_id BIGINT
)
BEGIN
    SELECT
        a.id,
        a.class_id       AS classId,
        c.name           AS className,
        c.academy_id     AS academyId,
        a.curriculum_id  AS curriculumId,
        cu.unit_title    AS unitTitle,
        a.title,
        a.body,
        a.due_at         AS dueAt,
        a.created_by_user_id AS createdByUserId,
        u.name           AS createdByName,
        a.created_at     AS createdAt,
        a.updated_at     AS updatedAt
    FROM ium_assignment a
    JOIN ium_class c ON c.id = a.class_id
    LEFT JOIN ium_curriculum cu ON cu.id = a.curriculum_id
    LEFT JOIN ium_users u ON u.id = a.created_by_user_id
    WHERE a.id = p_id AND a.del_yn = 'N';
END$$

-- 과제 생성 — 반 소속 학생(ACTIVE) 전원에 대해 PENDING 제출 레코드 미리 생성
CREATE PROCEDURE sp_ium_assignment_create(
    IN p_class_id          BIGINT,
    IN p_curriculum_id     BIGINT,
    IN p_title             VARCHAR(200),
    IN p_body              TEXT,
    IN p_due_at            DATETIME,
    IN p_created_by_user_id BIGINT
)
BEGIN
    DECLARE v_id BIGINT DEFAULT 0;

    IF p_title IS NULL OR TRIM(p_title) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'TITLE_REQUIRED';
    END IF;

    INSERT INTO ium_assignment
        (class_id, curriculum_id, title, body, due_at, created_by_user_id)
    VALUES
        (p_class_id,
         NULLIF(p_curriculum_id, 0),
         TRIM(p_title),
         NULLIF(p_body, ''),
         p_due_at,
         NULLIF(p_created_by_user_id, 0));

    SET v_id = LAST_INSERT_ID();

    INSERT INTO ium_assignment_submission (assignment_id, student_id, status)
    SELECT v_id, e.student_id, 'PENDING'
      FROM ium_class_enrollment e
     WHERE e.class_id = p_class_id AND e.status = 'ACTIVE';

    SELECT v_id AS id;
END$$

CREATE PROCEDURE sp_ium_assignment_update(
    IN p_id              BIGINT,
    IN p_curriculum_id   BIGINT,
    IN p_title           VARCHAR(200),
    IN p_body            TEXT,
    IN p_due_at          DATETIME
)
BEGIN
    IF p_title IS NULL OR TRIM(p_title) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'TITLE_REQUIRED';
    END IF;

    UPDATE ium_assignment
       SET curriculum_id = NULLIF(p_curriculum_id, 0),
           title         = TRIM(p_title),
           body          = NULLIF(p_body, ''),
           due_at        = p_due_at
     WHERE id = p_id AND del_yn = 'N';

    SELECT ROW_COUNT() AS affected;
END$$

CREATE PROCEDURE sp_ium_assignment_delete(
    IN p_id BIGINT
)
BEGIN
    UPDATE ium_assignment SET del_yn = 'Y' WHERE id = p_id;
    SELECT ROW_COUNT() AS affected;
END$$

-- 제출 매트릭스 조회 (과제 id 기준 — 반 내 모든 학생의 제출 상태)
CREATE PROCEDURE sp_ium_assignment_submissions_get(
    IN p_assignment_id BIGINT
)
BEGIN
    DECLARE v_class_id BIGINT DEFAULT 0;
    SELECT class_id INTO v_class_id FROM ium_assignment
     WHERE id = p_assignment_id AND del_yn = 'N';

    -- 반 ACTIVE 학생 전부 + 기존 제출 조인 (혹시 enrollment 후 생성된 경우 대비)
    SELECT
        s.id                     AS studentId,
        s.name                   AS studentName,
        s.grade,
        sub.id                   AS submissionId,
        IFNULL(sub.status, 'PENDING') AS status,
        sub.submitted_at         AS submittedAt,
        sub.score,
        sub.feedback,
        sub.graded_at            AS gradedAt,
        sub.a_point_earned       AS aPointEarned
    FROM ium_class_enrollment e
    JOIN ium_students s ON s.id = e.student_id
    LEFT JOIN ium_assignment_submission sub
           ON sub.assignment_id = p_assignment_id
          AND sub.student_id = s.id
    WHERE e.class_id = v_class_id
      AND e.status = 'ACTIVE'
      AND s.del_yn = 'N'
    ORDER BY s.name;
END$$

-- 제출 상태/점수/피드백 upsert
-- status = 'DONE' 이고 score >= 90 이면 A 등급 포인트 자동 적립 (중복 방지)
CREATE PROCEDURE sp_ium_assignment_submission_upsert(
    IN p_assignment_id  BIGINT,
    IN p_student_id     BIGINT,
    IN p_status         VARCHAR(20),
    IN p_score          INT,
    IN p_feedback       VARCHAR(500),
    IN p_grader_user_id BIGINT
)
BEGIN
    DECLARE v_due DATETIME DEFAULT NULL;
    DECLARE v_effective_status VARCHAR(20) DEFAULT 'PENDING';
    DECLARE v_prev_a TINYINT DEFAULT 0;
    DECLARE v_earned TINYINT DEFAULT 0;

    IF p_status NOT IN ('PENDING','DONE','LATE','MISSING') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_STATUS';
    END IF;

    SELECT due_at INTO v_due FROM ium_assignment
     WHERE id = p_assignment_id AND del_yn = 'N';

    -- 제출 시점과 마감일 비교하여 DONE/LATE 자동 보정
    SET v_effective_status = p_status;
    IF p_status = 'DONE' AND v_due IS NOT NULL AND v_due < CURRENT_TIMESTAMP THEN
        SET v_effective_status = 'LATE';
    END IF;

    SELECT a_point_earned INTO v_prev_a FROM ium_assignment_submission
     WHERE assignment_id = p_assignment_id AND student_id = p_student_id;
    IF v_prev_a IS NULL THEN SET v_prev_a = 0; END IF;

    INSERT INTO ium_assignment_submission
        (assignment_id, student_id, status, submitted_at, score, feedback,
         graded_at, grader_user_id)
    VALUES
        (p_assignment_id, p_student_id, v_effective_status,
         IF(v_effective_status IN ('DONE','LATE'), CURRENT_TIMESTAMP, NULL),
         p_score,
         NULLIF(TRIM(p_feedback), ''),
         IF(p_score IS NOT NULL, CURRENT_TIMESTAMP, NULL),
         NULLIF(p_grader_user_id, 0))
    ON DUPLICATE KEY UPDATE
         status       = v_effective_status,
         submitted_at = IF(v_effective_status IN ('DONE','LATE'),
                           COALESCE(ium_assignment_submission.submitted_at, CURRENT_TIMESTAMP),
                           ium_assignment_submission.submitted_at),
         score        = p_score,
         feedback     = NULLIF(TRIM(p_feedback), ''),
         graded_at    = IF(p_score IS NOT NULL, CURRENT_TIMESTAMP,
                           ium_assignment_submission.graded_at),
         grader_user_id = IFNULL(NULLIF(p_grader_user_id, 0),
                                 ium_assignment_submission.grader_user_id);

    -- A 등급(90+) + DONE/LATE + 최초 1회 만 포인트 적립
    IF v_prev_a = 0
       AND v_effective_status IN ('DONE','LATE')
       AND p_score IS NOT NULL
       AND p_score >= 90 THEN
        CALL sp_gami_trigger_assignment_a(p_student_id);
        UPDATE ium_assignment_submission
           SET a_point_earned = 1
         WHERE assignment_id = p_assignment_id AND student_id = p_student_id;
        SET v_earned = 1;
    END IF;

    SELECT
        id,
        status,
        submitted_at  AS submittedAt,
        score,
        a_point_earned AS aPointEarned,
        v_earned      AS earnedNow
      FROM ium_assignment_submission
     WHERE assignment_id = p_assignment_id AND student_id = p_student_id;
END$$

-- 학생별 과제 통계
CREATE PROCEDURE sp_ium_assignment_stats_by_student(
    IN p_student_id BIGINT
)
BEGIN
    SELECT
        SUM(status = 'DONE')    AS done,
        SUM(status = 'LATE')    AS late,
        SUM(status = 'MISSING') AS missing,
        SUM(status = 'PENDING') AS pending,
        SUM(status IN ('DONE','LATE') AND score IS NOT NULL AND score >= 90) AS aCount,
        AVG(CASE WHEN status IN ('DONE','LATE') AND score IS NOT NULL THEN score END) AS avgScore,
        COUNT(*) AS total
      FROM ium_assignment_submission
     WHERE student_id = p_student_id;
END$$

-- 마감 지난 PENDING을 MISSING 으로 일괄 전환 (배치용)
CREATE PROCEDURE sp_ium_assignment_auto_mark_missing()
BEGIN
    UPDATE ium_assignment_submission s
      JOIN ium_assignment a ON a.id = s.assignment_id
       SET s.status = 'MISSING'
     WHERE s.status = 'PENDING'
       AND a.del_yn = 'N'
       AND a.due_at IS NOT NULL
       AND a.due_at < CURRENT_TIMESTAMP;
    SELECT ROW_COUNT() AS affected;
END$$

DELIMITER ;

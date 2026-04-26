-- ============================================================
-- 이음(I-UM) 출결 관리 (Attendance) 테이블 및 프로시저
-- 기획서 항목 [2-1] 출결 관리
-- 연계: 게이미피케이션(+1) — 출석(PRESENT) 처리 시 sp_gami_trigger_attendance 자동 호출
-- 선행: ium_students (1-5)
-- ============================================================

-- 1) 출결 기록
--    PK: (student_id, date)  — 일자당 1 레코드 (시작은 반/세션 개념 없이 단순화)
--    class_id 는 장래 시간표(3-1) 연계를 위해 NULL 허용으로 예비
CREATE TABLE IF NOT EXISTS ium_attendance (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    academy_id      BIGINT       NOT NULL COMMENT '소속 학원 FK',
    student_id      BIGINT       NOT NULL,
    class_id        BIGINT       NULL COMMENT '수업/반 FK (3-1 연계 예비)',
    date            DATE         NOT NULL COMMENT '출석 일자(KST 기준)',
    status          VARCHAR(20)  NOT NULL DEFAULT 'PRESENT'
                    COMMENT 'PRESENT/LATE/EARLY_LEAVE/ABSENT/EXCUSED',
    check_in_at     DATETIME     NULL COMMENT '등원 시각',
    check_out_at    DATETIME     NULL COMMENT '하원 시각',
    memo            VARCHAR(500) NULL,
    recorder_user_id BIGINT      NULL COMMENT '기록자(ium_users.id)',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_att_student_date (student_id, date),
    INDEX idx_academy_date (academy_id, date),
    INDEX idx_status (status),
    CONSTRAINT fk_ium_att_student
        FOREIGN KEY (student_id) REFERENCES ium_students (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ium_att_academy
        FOREIGN KEY (academy_id) REFERENCES ium_academies (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='이음 출결 기록';

-- ------------------------------------------------------------
-- 프로시저 — 갱신 안전을 위해 DROP 후 CREATE
-- ------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_ium_attendance_list_by_date;
DROP PROCEDURE IF EXISTS sp_ium_attendance_list_by_date_for_academy;
DROP PROCEDURE IF EXISTS sp_ium_attendance_upsert;
DROP PROCEDURE IF EXISTS sp_ium_attendance_check_in;
DROP PROCEDURE IF EXISTS sp_ium_attendance_check_out;
DROP PROCEDURE IF EXISTS sp_ium_attendance_delete;
DROP PROCEDURE IF EXISTS sp_ium_attendance_summary_by_student;
DROP PROCEDURE IF EXISTS sp_ium_attendance_daily_stats;

DELIMITER $$

-- ------------------------------------------------------------
-- 일자별 전체 학원(시스템 관리자 전용) — 학생 명단 + 당일 출결
-- ------------------------------------------------------------
CREATE PROCEDURE sp_ium_attendance_list_by_date(
    IN p_date DATE
)
BEGIN
    SELECT
        s.id           AS studentId,
        s.academy_id   AS academyId,
        a.name         AS academyName,
        s.name,
        s.grade,
        s.school,
        att.id         AS attendanceId,
        att.status,
        att.check_in_at  AS checkInAt,
        att.check_out_at AS checkOutAt,
        att.memo,
        att.updated_at   AS updatedAt
    FROM ium_students s
    LEFT JOIN ium_academies a ON a.id = s.academy_id
    LEFT JOIN ium_attendance att
           ON att.student_id = s.id
          AND att.date = p_date
    WHERE s.del_yn = 'N'
      AND s.status = 'ACTIVE'
    ORDER BY a.name, s.name;
END$$

-- ------------------------------------------------------------
-- 일자별 특정 학원 — 학생 명단 + 당일 출결
-- ------------------------------------------------------------
CREATE PROCEDURE sp_ium_attendance_list_by_date_for_academy(
    IN p_academy_id BIGINT,
    IN p_date       DATE
)
BEGIN
    SELECT
        s.id           AS studentId,
        s.academy_id   AS academyId,
        a.name         AS academyName,
        s.name,
        s.grade,
        s.school,
        att.id         AS attendanceId,
        att.status,
        att.check_in_at  AS checkInAt,
        att.check_out_at AS checkOutAt,
        att.memo,
        att.updated_at   AS updatedAt
    FROM ium_students s
    LEFT JOIN ium_academies a ON a.id = s.academy_id
    LEFT JOIN ium_attendance att
           ON att.student_id = s.id
          AND att.date = p_date
    WHERE s.del_yn = 'N'
      AND s.status = 'ACTIVE'
      AND s.academy_id = p_academy_id
    ORDER BY s.name;
END$$

-- ------------------------------------------------------------
-- 상태 저장 — upsert
--   * 기존이 PRESENT/LATE 가 아니었다가 PRESENT/LATE 로 "처음" 바뀔 때
--     게이미피케이션 포인트 1회 자동 적립
-- ------------------------------------------------------------
CREATE PROCEDURE sp_ium_attendance_upsert(
    IN p_student_id      BIGINT,
    IN p_date            DATE,
    IN p_status          VARCHAR(20),
    IN p_memo            VARCHAR(500),
    IN p_recorder_id     BIGINT
)
BEGIN
    DECLARE v_academy_id BIGINT DEFAULT NULL;
    DECLARE v_prev_status VARCHAR(20) DEFAULT NULL;
    DECLARE v_new_id BIGINT DEFAULT 0;
    DECLARE v_earn_point TINYINT DEFAULT 0;

    IF p_status NOT IN ('PRESENT','LATE','EARLY_LEAVE','ABSENT','EXCUSED') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_STATUS';
    END IF;

    SELECT academy_id INTO v_academy_id FROM ium_students
     WHERE id = p_student_id AND del_yn = 'N';
    IF v_academy_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'STUDENT_NOT_FOUND';
    END IF;

    SELECT status INTO v_prev_status FROM ium_attendance
     WHERE student_id = p_student_id AND date = p_date
     LIMIT 1;

    INSERT INTO ium_attendance
        (academy_id, student_id, date, status, memo, recorder_user_id,
         check_in_at)
    VALUES
        (v_academy_id, p_student_id, p_date, p_status,
         NULLIF(TRIM(p_memo), ''), p_recorder_id,
         IF(p_status IN ('PRESENT','LATE'), CURRENT_TIMESTAMP, NULL))
    ON DUPLICATE KEY UPDATE
         status        = VALUES(status),
         memo          = VALUES(memo),
         recorder_user_id = VALUES(recorder_user_id),
         check_in_at   = IF(
             VALUES(status) IN ('PRESENT','LATE') AND ium_attendance.check_in_at IS NULL,
             CURRENT_TIMESTAMP,
             ium_attendance.check_in_at);

    SELECT id INTO v_new_id FROM ium_attendance
     WHERE student_id = p_student_id AND date = p_date
     LIMIT 1;

    -- 출석(PRESENT/LATE)으로 "처음" 진입한 경우에만 포인트 적립
    IF p_status IN ('PRESENT','LATE')
       AND (v_prev_status IS NULL OR v_prev_status NOT IN ('PRESENT','LATE')) THEN
        CALL sp_gami_trigger_attendance(p_student_id);
        SET v_earn_point = 1;
    END IF;

    SELECT
        v_new_id       AS id,
        v_earn_point   AS earned;
END$$

-- ------------------------------------------------------------
-- 등원 체크 — PRESENT(현재 KST)로 즉시 기록
-- ------------------------------------------------------------
CREATE PROCEDURE sp_ium_attendance_check_in(
    IN p_student_id  BIGINT,
    IN p_date        DATE,
    IN p_recorder_id BIGINT
)
BEGIN
    DECLARE v_academy_id BIGINT DEFAULT NULL;
    DECLARE v_prev_status VARCHAR(20) DEFAULT NULL;

    SELECT academy_id INTO v_academy_id FROM ium_students
     WHERE id = p_student_id AND del_yn = 'N';
    IF v_academy_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'STUDENT_NOT_FOUND';
    END IF;

    SELECT status INTO v_prev_status FROM ium_attendance
     WHERE student_id = p_student_id AND date = p_date
     LIMIT 1;

    INSERT INTO ium_attendance
        (academy_id, student_id, date, status, check_in_at, recorder_user_id)
    VALUES
        (v_academy_id, p_student_id, p_date, 'PRESENT', CURRENT_TIMESTAMP, p_recorder_id)
    ON DUPLICATE KEY UPDATE
         status       = 'PRESENT',
         check_in_at  = COALESCE(ium_attendance.check_in_at, CURRENT_TIMESTAMP),
         recorder_user_id = p_recorder_id;

    IF v_prev_status IS NULL OR v_prev_status NOT IN ('PRESENT','LATE') THEN
        CALL sp_gami_trigger_attendance(p_student_id);
    END IF;

    SELECT
        id, status, check_in_at AS checkInAt, check_out_at AS checkOutAt
      FROM ium_attendance
     WHERE student_id = p_student_id AND date = p_date
     LIMIT 1;
END$$

-- ------------------------------------------------------------
-- 하원 체크 — check_out_at 기록 (status 변경 없음)
-- ------------------------------------------------------------
CREATE PROCEDURE sp_ium_attendance_check_out(
    IN p_student_id  BIGINT,
    IN p_date        DATE
)
BEGIN
    UPDATE ium_attendance
       SET check_out_at = COALESCE(check_out_at, CURRENT_TIMESTAMP)
     WHERE student_id = p_student_id AND date = p_date;

    SELECT
        id, status, check_in_at AS checkInAt, check_out_at AS checkOutAt
      FROM ium_attendance
     WHERE student_id = p_student_id AND date = p_date
     LIMIT 1;
END$$

-- ------------------------------------------------------------
-- 출결 기록 삭제 (관리자 오기록 복구)
-- ------------------------------------------------------------
CREATE PROCEDURE sp_ium_attendance_delete(
    IN p_student_id  BIGINT,
    IN p_date        DATE
)
BEGIN
    DELETE FROM ium_attendance
     WHERE student_id = p_student_id AND date = p_date;
    SELECT ROW_COUNT() AS affected;
END$$

-- ------------------------------------------------------------
-- 학생별 기간 요약 (출석/지각/조퇴/결석/사유결석 카운트 + 출석률)
--   period_days: p_from ~ p_to (inclusive) 내 최대 가능일수
-- ------------------------------------------------------------
CREATE PROCEDURE sp_ium_attendance_summary_by_student(
    IN p_student_id BIGINT,
    IN p_from       DATE,
    IN p_to         DATE
)
BEGIN
    SELECT
        SUM(status = 'PRESENT')      AS present,
        SUM(status = 'LATE')         AS late,
        SUM(status = 'EARLY_LEAVE')  AS earlyLeave,
        SUM(status = 'ABSENT')       AS absent,
        SUM(status = 'EXCUSED')      AS excused,
        COUNT(*)                     AS total,
        ROUND(
            100 * SUM(status IN ('PRESENT','LATE','EARLY_LEAVE')) /
            NULLIF(COUNT(*), 0),
            1
        ) AS attendanceRate
      FROM ium_attendance
     WHERE student_id = p_student_id
       AND date BETWEEN p_from AND p_to;
END$$

-- ------------------------------------------------------------
-- 일자 요약 (특정 학원 또는 전체) — 카드 위젯용
--   p_academy_id IS NULL 이면 전체 학원 집계
-- ------------------------------------------------------------
CREATE PROCEDURE sp_ium_attendance_daily_stats(
    IN p_academy_id BIGINT,
    IN p_date       DATE
)
BEGIN
    DECLARE v_total INT DEFAULT 0;

    SELECT COUNT(*) INTO v_total
      FROM ium_students s
     WHERE s.del_yn = 'N'
       AND s.status = 'ACTIVE'
       AND (p_academy_id IS NULL OR s.academy_id = p_academy_id);

    SELECT
        v_total AS activeStudents,
        COALESCE(SUM(att.status = 'PRESENT'), 0)      AS present,
        COALESCE(SUM(att.status = 'LATE'), 0)         AS late,
        COALESCE(SUM(att.status = 'EARLY_LEAVE'), 0)  AS earlyLeave,
        COALESCE(SUM(att.status = 'ABSENT'), 0)       AS absent,
        COALESCE(SUM(att.status = 'EXCUSED'), 0)      AS excused,
        COALESCE(SUM(att.id IS NOT NULL), 0)          AS recorded,
        ROUND(
            100 * COALESCE(SUM(att.status IN ('PRESENT','LATE','EARLY_LEAVE')), 0) /
            NULLIF(v_total, 0),
            1
        ) AS attendanceRate
      FROM ium_students s
      LEFT JOIN ium_attendance att
             ON att.student_id = s.id
            AND att.date = p_date
     WHERE s.del_yn = 'N'
       AND s.status = 'ACTIVE'
       AND (p_academy_id IS NULL OR s.academy_id = p_academy_id);
END$$

DELIMITER ;

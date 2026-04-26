-- ============================================================
-- 이음(I-UM) 반(Class) · 수강 등록(Enrollment) · 레벨 테스트(Level Test)
-- 기획서 항목 [1-3] 레벨 테스트 → 반 매칭 / P1-2
-- 선행: ium_academies, ium_students, ium_users, ium_consultation
-- ============================================================

-- 1) 반(Class)
CREATE TABLE IF NOT EXISTS ium_class (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    academy_id       BIGINT       NOT NULL,
    name             VARCHAR(100) NOT NULL COMMENT '반명',
    subject          VARCHAR(50)  NOT NULL COMMENT '과목(국어/영어/수학/...)',
    level            VARCHAR(20)  NULL COMMENT '레벨(초급/중급/고급 또는 임의)',
    teacher_user_id  BIGINT       NULL COMMENT '담임 강사(ium_users.id)',
    capacity         INT          NOT NULL DEFAULT 20 COMMENT '정원',
    schedule_note    VARCHAR(200) NULL COMMENT '요일·시간 메모(시간표 도입 전 임시)',
    is_active        CHAR(1)      NOT NULL DEFAULT 'Y',
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    del_yn           CHAR(1)      NOT NULL DEFAULT 'N',
    INDEX idx_academy_active (academy_id, is_active, del_yn),
    INDEX idx_subject_level (subject, level),
    CONSTRAINT fk_ium_class_academy
        FOREIGN KEY (academy_id) REFERENCES ium_academies (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='이음 반(수업 단위)';

-- 2) 수강 등록 — 학생-반 매핑
CREATE TABLE IF NOT EXISTS ium_class_enrollment (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    class_id     BIGINT       NOT NULL,
    student_id   BIGINT       NOT NULL,
    enrolled_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    left_at      DATETIME     NULL,
    status       VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE/DROPPED',
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_class_student_active (class_id, student_id, status),
    INDEX idx_class (class_id, status),
    INDEX idx_student (student_id, status),
    CONSTRAINT fk_ium_enrl_class
        FOREIGN KEY (class_id) REFERENCES ium_class (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ium_enrl_student
        FOREIGN KEY (student_id) REFERENCES ium_students (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='학생 반 등록';

-- 3) 레벨 테스트 — 학생 또는 상담 대상자에 대한 점수 기록
CREATE TABLE IF NOT EXISTS ium_level_test (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    academy_id        BIGINT       NOT NULL,
    consultation_id   BIGINT       NULL COMMENT '상담 카드 FK (미등록자 허용)',
    student_id        BIGINT       NULL COMMENT '학생 FK (전환 후 채움)',
    subject           VARCHAR(50)  NOT NULL,
    score             INT          NULL COMMENT '점수(0~100)',
    level_result      VARCHAR(20)  NULL COMMENT '결과 레벨 레이블',
    tested_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tester_user_id    BIGINT       NULL,
    memo              VARCHAR(500) NULL,
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_consult (consultation_id),
    INDEX idx_student (student_id),
    INDEX idx_academy_subject (academy_id, subject),
    CONSTRAINT fk_ium_lt_academy
        FOREIGN KEY (academy_id) REFERENCES ium_academies (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_ium_lt_consult
        FOREIGN KEY (consultation_id) REFERENCES ium_consultation (id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_ium_lt_student
        FOREIGN KEY (student_id) REFERENCES ium_students (id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='이음 레벨 테스트 결과';

-- ------------------------------------------------------------
-- 프로시저
-- ------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_ium_class_list;
DROP PROCEDURE IF EXISTS sp_ium_class_list_for_academy;
DROP PROCEDURE IF EXISTS sp_ium_class_get;
DROP PROCEDURE IF EXISTS sp_ium_class_upsert;
DROP PROCEDURE IF EXISTS sp_ium_class_delete;
DROP PROCEDURE IF EXISTS sp_ium_class_match;
DROP PROCEDURE IF EXISTS sp_ium_class_enrollment_list;
DROP PROCEDURE IF EXISTS sp_ium_class_enroll;
DROP PROCEDURE IF EXISTS sp_ium_class_unenroll;
DROP PROCEDURE IF EXISTS sp_ium_class_enrollments_by_student;
DROP PROCEDURE IF EXISTS sp_ium_level_test_save;
DROP PROCEDURE IF EXISTS sp_ium_level_test_list_by_consult;
DROP PROCEDURE IF EXISTS sp_ium_level_test_list_by_student;
DROP PROCEDURE IF EXISTS sp_ium_level_test_delete;

DELIMITER $$

-- 반 목록 (전역)
CREATE PROCEDURE sp_ium_class_list(
    IN p_subject VARCHAR(50),
    IN p_keyword VARCHAR(100)
)
BEGIN
    SELECT
        c.id,
        c.academy_id      AS academyId,
        a.name            AS academyName,
        c.name,
        c.subject,
        c.level,
        c.teacher_user_id AS teacherUserId,
        u.name            AS teacherName,
        c.capacity,
        c.schedule_note   AS scheduleNote,
        c.is_active       AS isActive,
        (SELECT COUNT(*) FROM ium_class_enrollment e
          WHERE e.class_id = c.id AND e.status = 'ACTIVE') AS enrolledCount,
        c.created_at      AS createdAt,
        c.updated_at      AS updatedAt
    FROM ium_class c
    LEFT JOIN ium_academies a ON a.id = c.academy_id
    LEFT JOIN ium_users u     ON u.id = c.teacher_user_id
    WHERE c.del_yn = 'N'
      AND (p_subject IS NULL OR p_subject = '' OR c.subject = p_subject)
      AND (p_keyword IS NULL OR p_keyword = ''
           OR c.name LIKE CONCAT('%', p_keyword, '%')
           OR c.level LIKE CONCAT('%', p_keyword, '%'))
    ORDER BY c.is_active DESC, a.name, c.subject, c.name;
END$$

-- 반 목록 (학원별)
CREATE PROCEDURE sp_ium_class_list_for_academy(
    IN p_academy_id BIGINT,
    IN p_subject    VARCHAR(50),
    IN p_keyword    VARCHAR(100)
)
BEGIN
    SELECT
        c.id,
        c.academy_id      AS academyId,
        a.name            AS academyName,
        c.name,
        c.subject,
        c.level,
        c.teacher_user_id AS teacherUserId,
        u.name            AS teacherName,
        c.capacity,
        c.schedule_note   AS scheduleNote,
        c.is_active       AS isActive,
        (SELECT COUNT(*) FROM ium_class_enrollment e
          WHERE e.class_id = c.id AND e.status = 'ACTIVE') AS enrolledCount,
        c.created_at      AS createdAt,
        c.updated_at      AS updatedAt
    FROM ium_class c
    LEFT JOIN ium_academies a ON a.id = c.academy_id
    LEFT JOIN ium_users u     ON u.id = c.teacher_user_id
    WHERE c.del_yn = 'N'
      AND c.academy_id = p_academy_id
      AND (p_subject IS NULL OR p_subject = '' OR c.subject = p_subject)
      AND (p_keyword IS NULL OR p_keyword = ''
           OR c.name LIKE CONCAT('%', p_keyword, '%')
           OR c.level LIKE CONCAT('%', p_keyword, '%'))
    ORDER BY c.is_active DESC, c.subject, c.name;
END$$

CREATE PROCEDURE sp_ium_class_get(
    IN p_id BIGINT
)
BEGIN
    SELECT
        c.id,
        c.academy_id      AS academyId,
        a.name            AS academyName,
        c.name,
        c.subject,
        c.level,
        c.teacher_user_id AS teacherUserId,
        u.name            AS teacherName,
        c.capacity,
        c.schedule_note   AS scheduleNote,
        c.is_active       AS isActive,
        (SELECT COUNT(*) FROM ium_class_enrollment e
          WHERE e.class_id = c.id AND e.status = 'ACTIVE') AS enrolledCount,
        c.created_at      AS createdAt,
        c.updated_at      AS updatedAt
    FROM ium_class c
    LEFT JOIN ium_academies a ON a.id = c.academy_id
    LEFT JOIN ium_users u     ON u.id = c.teacher_user_id
    WHERE c.id = p_id AND c.del_yn = 'N';
END$$

-- 반 생성/수정 (id=0 이면 INSERT)
CREATE PROCEDURE sp_ium_class_upsert(
    IN p_id              BIGINT,
    IN p_academy_id      BIGINT,
    IN p_name            VARCHAR(100),
    IN p_subject         VARCHAR(50),
    IN p_level           VARCHAR(20),
    IN p_teacher_user_id BIGINT,
    IN p_capacity        INT,
    IN p_schedule_note   VARCHAR(200),
    IN p_is_active       CHAR(1)
)
BEGIN
    DECLARE v_id BIGINT DEFAULT 0;
    DECLARE v_ac INT DEFAULT 0;

    IF p_name IS NULL OR TRIM(p_name) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CLASS_NAME_REQUIRED';
    END IF;
    IF p_subject IS NULL OR TRIM(p_subject) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SUBJECT_REQUIRED';
    END IF;

    IF p_id IS NULL OR p_id = 0 THEN
        IF p_academy_id IS NULL OR p_academy_id <= 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ACADEMY_REQUIRED';
        END IF;
        SELECT COUNT(*) INTO v_ac FROM ium_academies WHERE id = p_academy_id AND is_active = 'Y';
        IF v_ac = 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_ACADEMY';
        END IF;

        INSERT INTO ium_class
            (academy_id, name, subject, level, teacher_user_id,
             capacity, schedule_note, is_active)
        VALUES
            (p_academy_id, TRIM(p_name), TRIM(p_subject),
             NULLIF(TRIM(p_level), ''), NULLIF(p_teacher_user_id, 0),
             GREATEST(IFNULL(p_capacity, 20), 1),
             NULLIF(TRIM(p_schedule_note), ''),
             IFNULL(p_is_active, 'Y'));
        SET v_id = LAST_INSERT_ID();
    ELSE
        UPDATE ium_class
           SET name            = TRIM(p_name),
               subject         = TRIM(p_subject),
               level           = NULLIF(TRIM(p_level), ''),
               teacher_user_id = NULLIF(p_teacher_user_id, 0),
               capacity        = GREATEST(IFNULL(p_capacity, capacity), 1),
               schedule_note   = NULLIF(TRIM(p_schedule_note), ''),
               is_active       = IFNULL(p_is_active, is_active)
         WHERE id = p_id AND del_yn = 'N';
        SET v_id = p_id;
    END IF;

    SELECT v_id AS id;
END$$

CREATE PROCEDURE sp_ium_class_delete(
    IN p_id BIGINT
)
BEGIN
    UPDATE ium_class SET del_yn = 'Y' WHERE id = p_id;
    SELECT ROW_COUNT() AS affected;
END$$

-- 반 매칭 — 같은 학원·과목·레벨(있다면) + 정원 미달 기준 Top-N 반환
CREATE PROCEDURE sp_ium_class_match(
    IN p_academy_id BIGINT,
    IN p_subject    VARCHAR(50),
    IN p_level      VARCHAR(20),
    IN p_limit      INT
)
BEGIN
    -- LIMIT 는 SP 내 일반 SELECT 에서 표현식(IFNULL 등)을 허용하지 않는 경우가 많음 → 로컬 변수 사용
    DECLARE v_lim INT UNSIGNED DEFAULT 5;
    IF p_limit IS NOT NULL AND p_limit > 0 THEN
        SET v_lim = CAST(p_limit AS UNSIGNED);
    END IF;

    SELECT
        c.id,
        c.name,
        c.subject,
        c.level,
        c.capacity,
        (SELECT COUNT(*) FROM ium_class_enrollment e
          WHERE e.class_id = c.id AND e.status = 'ACTIVE') AS enrolledCount,
        u.name AS teacherName,
        c.schedule_note AS scheduleNote,
        -- 점수: 레벨 일치 + 여유 인원
        (CASE WHEN c.level = p_level THEN 10 ELSE 0 END) +
        (c.capacity - (SELECT COUNT(*) FROM ium_class_enrollment e
                        WHERE e.class_id = c.id AND e.status = 'ACTIVE')) AS matchScore
    FROM ium_class c
    LEFT JOIN ium_users u ON u.id = c.teacher_user_id
    WHERE c.del_yn = 'N'
      AND c.is_active = 'Y'
      AND c.academy_id = p_academy_id
      AND (p_subject IS NULL OR p_subject = '' OR c.subject = p_subject)
      AND (SELECT COUNT(*) FROM ium_class_enrollment e2
           WHERE e2.class_id = c.id AND e2.status = 'ACTIVE') < c.capacity
    ORDER BY matchScore DESC, c.name
    LIMIT v_lim;
END$$

-- 반 소속 학생 목록
CREATE PROCEDURE sp_ium_class_enrollment_list(
    IN p_class_id BIGINT
)
BEGIN
    SELECT
        e.id,
        e.class_id   AS classId,
        e.student_id AS studentId,
        s.name       AS studentName,
        s.grade,
        s.school,
        e.status,
        e.enrolled_at AS enrolledAt,
        e.left_at     AS leftAt
    FROM ium_class_enrollment e
    JOIN ium_students s ON s.id = e.student_id
    WHERE e.class_id = p_class_id
    ORDER BY e.status = 'ACTIVE' DESC, s.name;
END$$

-- 학생 소속 반 목록
CREATE PROCEDURE sp_ium_class_enrollments_by_student(
    IN p_student_id BIGINT
)
BEGIN
    SELECT
        e.id,
        e.class_id   AS classId,
        c.name       AS className,
        c.subject,
        c.level,
        u.name       AS teacherName,
        e.status,
        e.enrolled_at AS enrolledAt,
        e.left_at     AS leftAt
    FROM ium_class_enrollment e
    JOIN ium_class c ON c.id = e.class_id AND c.del_yn = 'N'
    LEFT JOIN ium_users u ON u.id = c.teacher_user_id
    WHERE e.student_id = p_student_id
    ORDER BY e.status = 'ACTIVE' DESC, e.enrolled_at DESC;
END$$

-- 반 등록 — 정원 초과 방지
CREATE PROCEDURE sp_ium_class_enroll(
    IN p_class_id   BIGINT,
    IN p_student_id BIGINT
)
BEGIN
    DECLARE v_capacity INT DEFAULT 0;
    DECLARE v_current  INT DEFAULT 0;
    DECLARE v_academy_c BIGINT DEFAULT 0;
    DECLARE v_academy_s BIGINT DEFAULT 0;

    SELECT academy_id, capacity INTO v_academy_c, v_capacity
      FROM ium_class
     WHERE id = p_class_id AND del_yn = 'N' AND is_active = 'Y';
    IF v_academy_c = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CLASS_NOT_FOUND';
    END IF;

    SELECT academy_id INTO v_academy_s FROM ium_students
     WHERE id = p_student_id AND del_yn = 'N';
    IF v_academy_s = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'STUDENT_NOT_FOUND';
    END IF;
    IF v_academy_s <> v_academy_c THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ACADEMY_MISMATCH';
    END IF;

    SELECT COUNT(*) INTO v_current FROM ium_class_enrollment
     WHERE class_id = p_class_id AND status = 'ACTIVE';
    IF v_current >= v_capacity THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CAPACITY_EXCEEDED';
    END IF;

    -- 이미 ACTIVE 면 UNIQUE 키로 충돌 → 예외로 안내
    INSERT INTO ium_class_enrollment (class_id, student_id, status)
    VALUES (p_class_id, p_student_id, 'ACTIVE');

    SELECT LAST_INSERT_ID() AS id;
END$$

-- 반 탈반
CREATE PROCEDURE sp_ium_class_unenroll(
    IN p_class_id   BIGINT,
    IN p_student_id BIGINT
)
BEGIN
    UPDATE ium_class_enrollment
       SET status  = 'DROPPED',
           left_at = CURRENT_TIMESTAMP
     WHERE class_id = p_class_id
       AND student_id = p_student_id
       AND status = 'ACTIVE';
    SELECT ROW_COUNT() AS affected;
END$$

-- 레벨 테스트 저장
CREATE PROCEDURE sp_ium_level_test_save(
    IN p_consultation_id BIGINT,
    IN p_student_id      BIGINT,
    IN p_academy_id      BIGINT,
    IN p_subject         VARCHAR(50),
    IN p_score           INT,
    IN p_level_result    VARCHAR(20),
    IN p_memo            VARCHAR(500),
    IN p_tester_user_id  BIGINT
)
BEGIN
    DECLARE v_ac INT DEFAULT 0;

    IF p_academy_id IS NULL OR p_academy_id <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ACADEMY_REQUIRED';
    END IF;
    SELECT COUNT(*) INTO v_ac FROM ium_academies
     WHERE id = p_academy_id AND is_active = 'Y';
    IF v_ac = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_ACADEMY';
    END IF;

    IF p_subject IS NULL OR TRIM(p_subject) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SUBJECT_REQUIRED';
    END IF;

    INSERT INTO ium_level_test
        (academy_id, consultation_id, student_id, subject,
         score, level_result, memo, tester_user_id)
    VALUES
        (p_academy_id,
         NULLIF(p_consultation_id, 0),
         NULLIF(p_student_id, 0),
         TRIM(p_subject),
         p_score,
         NULLIF(TRIM(p_level_result), ''),
         NULLIF(TRIM(p_memo), ''),
         NULLIF(p_tester_user_id, 0));

    SELECT LAST_INSERT_ID() AS id;
END$$

CREATE PROCEDURE sp_ium_level_test_list_by_consult(
    IN p_consultation_id BIGINT
)
BEGIN
    SELECT
        t.id,
        t.academy_id  AS academyId,
        t.subject,
        t.score,
        t.level_result AS levelResult,
        t.memo,
        t.tested_at    AS testedAt,
        t.tester_user_id AS testerUserId,
        u.name         AS testerName
    FROM ium_level_test t
    LEFT JOIN ium_users u ON u.id = t.tester_user_id
    WHERE t.consultation_id = p_consultation_id
    ORDER BY t.tested_at DESC;
END$$

CREATE PROCEDURE sp_ium_level_test_list_by_student(
    IN p_student_id BIGINT
)
BEGIN
    SELECT
        t.id,
        t.academy_id  AS academyId,
        t.subject,
        t.score,
        t.level_result AS levelResult,
        t.memo,
        t.tested_at    AS testedAt,
        t.tester_user_id AS testerUserId,
        u.name         AS testerName
    FROM ium_level_test t
    LEFT JOIN ium_users u ON u.id = t.tester_user_id
    WHERE t.student_id = p_student_id
    ORDER BY t.tested_at DESC;
END$$

CREATE PROCEDURE sp_ium_level_test_delete(
    IN p_id BIGINT
)
BEGIN
    DELETE FROM ium_level_test WHERE id = p_id;
    SELECT ROW_COUNT() AS affected;
END$$

DELIMITER ;

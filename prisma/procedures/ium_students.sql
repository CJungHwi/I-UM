-- ============================================================
-- 이음(I-UM) 학생 마스터 · 보호자 · 형제 관계 테이블 및 프로시저
-- 기획서 항목 [1-5] 학생 프로필
-- 연계: comm/threads, classes/rewards (기존 g5_member 기반 화면은 점진적으로 이 테이블 사용으로 이관)
-- ============================================================

-- 1) 학생 테이블
CREATE TABLE IF NOT EXISTS ium_students (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    academy_id    BIGINT       NOT NULL COMMENT '소속 학원 FK',
    name          VARCHAR(100) NOT NULL COMMENT '학생 이름',
    birthdate     DATE         NULL     COMMENT '생년월일',
    gender        CHAR(1)      NULL     COMMENT 'M/F/NULL',
    school        VARCHAR(100) NULL     COMMENT '재학 학교',
    grade         VARCHAR(20)  NULL     COMMENT '학년(예: 중2, 고1)',
    phone         VARCHAR(30)  NULL     COMMENT '학생 본인 연락처',
    parent_phone  VARCHAR(30)  NULL     COMMENT '기본 보호자 연락처(캐시)',
    allergy       VARCHAR(500) NULL     COMMENT '알레르기/특이사항',
    personality   VARCHAR(500) NULL     COMMENT '성격 특징 메모',
    memo          TEXT         NULL     COMMENT '기타 메모',
    family_group  BIGINT       NULL     COMMENT '가족 그룹 ID(형제 묶음)',
    status        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE/WITHDRAWN',
    enrolled_at   DATE         NULL     COMMENT '등록일(수강 시작일)',
    withdrawn_at  DATE         NULL     COMMENT '퇴원일',
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    del_yn        CHAR(1)      NOT NULL DEFAULT 'N',
    INDEX idx_academy_status (academy_id, status, del_yn),
    INDEX idx_name (name),
    INDEX idx_family (family_group),
    CONSTRAINT fk_ium_students_academy
        FOREIGN KEY (academy_id) REFERENCES ium_academies (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='이음 학생 마스터';

-- 2) 학생 보호자(연락처) — 1 학생 : N 보호자
CREATE TABLE IF NOT EXISTS ium_student_guardians (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT       NOT NULL,
    name       VARCHAR(100) NOT NULL COMMENT '보호자 이름',
    relation   VARCHAR(20)  NOT NULL DEFAULT '부모' COMMENT '부/모/조부모/기타',
    phone      VARCHAR(30)  NULL,
    email      VARCHAR(200) NULL,
    is_primary TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '대표 보호자(알림 대상)',
    user_id    BIGINT       NULL COMMENT 'ium_users 연결(학부모 계정 있는 경우)',
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    del_yn     CHAR(1)      NOT NULL DEFAULT 'N',
    INDEX idx_student (student_id, del_yn),
    CONSTRAINT fk_ium_guardians_student
        FOREIGN KEY (student_id) REFERENCES ium_students (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='이음 학생 보호자';

-- ------------------------------------------------------------
-- 3) 프로시저 — 갱신 안전을 위해 DROP 후 CREATE
-- ------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_ium_student_list;
DROP PROCEDURE IF EXISTS sp_ium_student_list_for_academy;
DROP PROCEDURE IF EXISTS sp_ium_student_get;
DROP PROCEDURE IF EXISTS sp_ium_student_create;
DROP PROCEDURE IF EXISTS sp_ium_student_update;
DROP PROCEDURE IF EXISTS sp_ium_student_set_status;
DROP PROCEDURE IF EXISTS sp_ium_student_delete;
DROP PROCEDURE IF EXISTS sp_ium_student_guardian_list;
DROP PROCEDURE IF EXISTS sp_ium_student_guardian_upsert;
DROP PROCEDURE IF EXISTS sp_ium_student_guardian_delete;
DROP PROCEDURE IF EXISTS sp_ium_student_sibling_list;
DROP PROCEDURE IF EXISTS sp_ium_student_sibling_link;
DROP PROCEDURE IF EXISTS sp_ium_student_sibling_unlink;

DELIMITER $$

-- 전역 관리자용: 전체 학원 또는 특정 상태/검색어
CREATE PROCEDURE sp_ium_student_list(
    IN p_status  VARCHAR(20),
    IN p_keyword VARCHAR(100)
)
BEGIN
    SELECT
        s.id,
        s.academy_id   AS academyId,
        a.name         AS academyName,
        s.name,
        s.birthdate,
        s.gender,
        s.school,
        s.grade,
        s.phone,
        s.parent_phone AS parentPhone,
        s.family_group AS familyGroup,
        s.status,
        s.enrolled_at  AS enrolledAt,
        s.withdrawn_at AS withdrawnAt,
        s.created_at   AS createdAt,
        s.updated_at   AS updatedAt,
        (SELECT COUNT(*) FROM ium_students s2
          WHERE s2.family_group = s.family_group
            AND s2.family_group IS NOT NULL
            AND s2.id <> s.id
            AND s2.del_yn = 'N') AS siblingCount
    FROM ium_students s
    LEFT JOIN ium_academies a ON a.id = s.academy_id
    WHERE s.del_yn = 'N'
      AND (p_status IS NULL OR p_status = '' OR s.status = p_status)
      AND (p_keyword IS NULL OR p_keyword = ''
           OR s.name   LIKE CONCAT('%', p_keyword, '%')
           OR s.school LIKE CONCAT('%', p_keyword, '%')
           OR s.phone  LIKE CONCAT('%', p_keyword, '%'))
    ORDER BY
        FIELD(s.status, 'ACTIVE', 'WITHDRAWN'),
        s.name ASC;
END$$

-- 학원 관리자용: 자기 학원만
CREATE PROCEDURE sp_ium_student_list_for_academy(
    IN p_academy_id BIGINT,
    IN p_status     VARCHAR(20),
    IN p_keyword    VARCHAR(100)
)
BEGIN
    SELECT
        s.id,
        s.academy_id   AS academyId,
        a.name         AS academyName,
        s.name,
        s.birthdate,
        s.gender,
        s.school,
        s.grade,
        s.phone,
        s.parent_phone AS parentPhone,
        s.family_group AS familyGroup,
        s.status,
        s.enrolled_at  AS enrolledAt,
        s.withdrawn_at AS withdrawnAt,
        s.created_at   AS createdAt,
        s.updated_at   AS updatedAt,
        (SELECT COUNT(*) FROM ium_students s2
          WHERE s2.family_group = s.family_group
            AND s2.family_group IS NOT NULL
            AND s2.id <> s.id
            AND s2.del_yn = 'N') AS siblingCount
    FROM ium_students s
    LEFT JOIN ium_academies a ON a.id = s.academy_id
    WHERE s.del_yn = 'N'
      AND s.academy_id = p_academy_id
      AND (p_status IS NULL OR p_status = '' OR s.status = p_status)
      AND (p_keyword IS NULL OR p_keyword = ''
           OR s.name   LIKE CONCAT('%', p_keyword, '%')
           OR s.school LIKE CONCAT('%', p_keyword, '%')
           OR s.phone  LIKE CONCAT('%', p_keyword, '%'))
    ORDER BY
        FIELD(s.status, 'ACTIVE', 'WITHDRAWN'),
        s.name ASC;
END$$

CREATE PROCEDURE sp_ium_student_get(
    IN p_id BIGINT
)
BEGIN
    SELECT
        s.id,
        s.academy_id   AS academyId,
        a.name         AS academyName,
        s.name,
        s.birthdate,
        s.gender,
        s.school,
        s.grade,
        s.phone,
        s.parent_phone AS parentPhone,
        s.allergy,
        s.personality,
        s.memo,
        s.family_group AS familyGroup,
        s.status,
        s.enrolled_at  AS enrolledAt,
        s.withdrawn_at AS withdrawnAt,
        s.created_at   AS createdAt,
        s.updated_at   AS updatedAt
    FROM ium_students s
    LEFT JOIN ium_academies a ON a.id = s.academy_id
    WHERE s.id = p_id AND s.del_yn = 'N';
END$$

CREATE PROCEDURE sp_ium_student_create(
    IN p_academy_id   BIGINT,
    IN p_name         VARCHAR(100),
    IN p_birthdate    DATE,
    IN p_gender       CHAR(1),
    IN p_school       VARCHAR(100),
    IN p_grade        VARCHAR(20),
    IN p_phone        VARCHAR(30),
    IN p_parent_phone VARCHAR(30),
    IN p_allergy      VARCHAR(500),
    IN p_personality  VARCHAR(500),
    IN p_memo         TEXT,
    IN p_enrolled_at  DATE
)
BEGIN
    DECLARE v_ac INT DEFAULT 0;

    IF p_academy_id IS NULL OR p_academy_id <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ACADEMY_REQUIRED';
    END IF;

    SELECT COUNT(*) INTO v_ac FROM ium_academies WHERE id = p_academy_id AND is_active = 'Y';
    IF v_ac = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_ACADEMY';
    END IF;

    IF p_name IS NULL OR TRIM(p_name) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NAME_REQUIRED';
    END IF;

    INSERT INTO ium_students
        (academy_id, name, birthdate, gender, school, grade, phone, parent_phone,
         allergy, personality, memo, status, enrolled_at)
    VALUES
        (p_academy_id, TRIM(p_name), p_birthdate, NULLIF(p_gender, ''),
         NULLIF(TRIM(p_school), ''), NULLIF(TRIM(p_grade), ''),
         NULLIF(TRIM(p_phone), ''), NULLIF(TRIM(p_parent_phone), ''),
         NULLIF(TRIM(p_allergy), ''), NULLIF(TRIM(p_personality), ''),
         NULLIF(p_memo, ''), 'ACTIVE', p_enrolled_at);

    SELECT LAST_INSERT_ID() AS id;
END$$

CREATE PROCEDURE sp_ium_student_update(
    IN p_id           BIGINT,
    IN p_name         VARCHAR(100),
    IN p_birthdate    DATE,
    IN p_gender       CHAR(1),
    IN p_school       VARCHAR(100),
    IN p_grade        VARCHAR(20),
    IN p_phone        VARCHAR(30),
    IN p_parent_phone VARCHAR(30),
    IN p_allergy      VARCHAR(500),
    IN p_personality  VARCHAR(500),
    IN p_memo         TEXT,
    IN p_enrolled_at  DATE
)
BEGIN
    IF p_name IS NULL OR TRIM(p_name) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NAME_REQUIRED';
    END IF;

    UPDATE ium_students
       SET name         = TRIM(p_name),
           birthdate    = p_birthdate,
           gender       = NULLIF(p_gender, ''),
           school       = NULLIF(TRIM(p_school), ''),
           grade        = NULLIF(TRIM(p_grade), ''),
           phone        = NULLIF(TRIM(p_phone), ''),
           parent_phone = NULLIF(TRIM(p_parent_phone), ''),
           allergy      = NULLIF(TRIM(p_allergy), ''),
           personality  = NULLIF(TRIM(p_personality), ''),
           memo         = NULLIF(p_memo, ''),
           enrolled_at  = p_enrolled_at
     WHERE id = p_id AND del_yn = 'N';

    SELECT ROW_COUNT() AS affected;
END$$

CREATE PROCEDURE sp_ium_student_set_status(
    IN p_id     BIGINT,
    IN p_status VARCHAR(20)
)
BEGIN
    IF p_status NOT IN ('ACTIVE', 'WITHDRAWN') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_STATUS';
    END IF;

    UPDATE ium_students
       SET status       = p_status,
           withdrawn_at = IF(p_status = 'WITHDRAWN', COALESCE(withdrawn_at, CURDATE()), NULL)
     WHERE id = p_id AND del_yn = 'N';

    SELECT ROW_COUNT() AS affected;
END$$

CREATE PROCEDURE sp_ium_student_delete(
    IN p_id BIGINT
)
BEGIN
    UPDATE ium_students SET del_yn = 'Y' WHERE id = p_id;
    SELECT ROW_COUNT() AS affected;
END$$

-- ------------------------------------------------------------
-- 보호자
-- ------------------------------------------------------------
CREATE PROCEDURE sp_ium_student_guardian_list(
    IN p_student_id BIGINT
)
BEGIN
    SELECT
        g.id,
        g.student_id AS studentId,
        g.name,
        g.relation,
        g.phone,
        g.email,
        g.is_primary AS isPrimary,
        g.user_id    AS userId,
        g.created_at AS createdAt
    FROM ium_student_guardians g
    WHERE g.student_id = p_student_id
      AND g.del_yn = 'N'
    ORDER BY g.is_primary DESC, g.created_at ASC;
END$$

-- id=0이면 INSERT, 아니면 UPDATE.
-- is_primary=1 로 저장 시 같은 학생의 다른 보호자는 0으로 내림
CREATE PROCEDURE sp_ium_student_guardian_upsert(
    IN p_id         BIGINT,
    IN p_student_id BIGINT,
    IN p_name       VARCHAR(100),
    IN p_relation   VARCHAR(20),
    IN p_phone      VARCHAR(30),
    IN p_email      VARCHAR(200),
    IN p_is_primary TINYINT
)
BEGIN
    DECLARE v_new_id BIGINT DEFAULT 0;

    IF p_name IS NULL OR TRIM(p_name) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'GUARDIAN_NAME_REQUIRED';
    END IF;

    IF p_id IS NULL OR p_id = 0 THEN
        INSERT INTO ium_student_guardians
            (student_id, name, relation, phone, email, is_primary)
        VALUES
            (p_student_id, TRIM(p_name),
             IFNULL(NULLIF(TRIM(p_relation), ''), '부모'),
             NULLIF(TRIM(p_phone), ''), NULLIF(TRIM(p_email), ''),
             IFNULL(p_is_primary, 0));
        SET v_new_id = LAST_INSERT_ID();
    ELSE
        UPDATE ium_student_guardians
           SET name      = TRIM(p_name),
               relation  = IFNULL(NULLIF(TRIM(p_relation), ''), '부모'),
               phone     = NULLIF(TRIM(p_phone), ''),
               email     = NULLIF(TRIM(p_email), ''),
               is_primary= IFNULL(p_is_primary, 0)
         WHERE id = p_id AND del_yn = 'N';
        SET v_new_id = p_id;
    END IF;

    -- 대표 보호자 유일성 보장
    IF IFNULL(p_is_primary, 0) = 1 THEN
        UPDATE ium_student_guardians
           SET is_primary = 0
         WHERE student_id = p_student_id
           AND id <> v_new_id
           AND del_yn = 'N';

        -- 학생 테이블 캐시 컬럼 동기화
        UPDATE ium_students s
           SET s.parent_phone = (
                SELECT g.phone FROM ium_student_guardians g
                 WHERE g.id = v_new_id)
         WHERE s.id = p_student_id;
    END IF;

    SELECT v_new_id AS id;
END$$

CREATE PROCEDURE sp_ium_student_guardian_delete(
    IN p_id BIGINT
)
BEGIN
    UPDATE ium_student_guardians SET del_yn = 'Y' WHERE id = p_id;
    SELECT ROW_COUNT() AS affected;
END$$

-- ------------------------------------------------------------
-- 형제 관계 — family_group 컬럼 기반
-- ------------------------------------------------------------
CREATE PROCEDURE sp_ium_student_sibling_list(
    IN p_student_id BIGINT
)
BEGIN
    DECLARE v_fg BIGINT DEFAULT NULL;
    SELECT family_group INTO v_fg FROM ium_students
     WHERE id = p_student_id AND del_yn = 'N';

    IF v_fg IS NULL THEN
        -- 형제 없음 → 빈 결과셋
        SELECT NULL AS id, NULL AS name, NULL AS grade, NULL AS school LIMIT 0;
    ELSE
        SELECT
            s.id,
            s.name,
            s.grade,
            s.school,
            s.status
        FROM ium_students s
        WHERE s.family_group = v_fg
          AND s.id <> p_student_id
          AND s.del_yn = 'N'
        ORDER BY s.name ASC;
    END IF;
END$$

-- 두 학생을 같은 family_group 으로 묶음
-- 한쪽만 그룹이 있으면 상대를 흡수, 둘 다 없으면 새 그룹(= 기준 학생 id) 할당
CREATE PROCEDURE sp_ium_student_sibling_link(
    IN p_student_id BIGINT,
    IN p_other_id   BIGINT
)
BEGIN
    DECLARE v_fg_a BIGINT DEFAULT NULL;
    DECLARE v_fg_b BIGINT DEFAULT NULL;
    DECLARE v_target BIGINT DEFAULT NULL;

    IF p_student_id = p_other_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'SAME_STUDENT';
    END IF;

    SELECT family_group INTO v_fg_a FROM ium_students WHERE id = p_student_id AND del_yn = 'N';
    SELECT family_group INTO v_fg_b FROM ium_students WHERE id = p_other_id   AND del_yn = 'N';

    IF v_fg_a IS NOT NULL THEN
        SET v_target = v_fg_a;
    ELSEIF v_fg_b IS NOT NULL THEN
        SET v_target = v_fg_b;
    ELSE
        SET v_target = p_student_id;
    END IF;

    UPDATE ium_students
       SET family_group = v_target
     WHERE id IN (p_student_id, p_other_id) AND del_yn = 'N';

    -- 기존 다른 그룹이 있다면 같은 그룹으로 병합
    IF v_fg_a IS NOT NULL AND v_fg_a <> v_target THEN
        UPDATE ium_students SET family_group = v_target
         WHERE family_group = v_fg_a AND del_yn = 'N';
    END IF;
    IF v_fg_b IS NOT NULL AND v_fg_b <> v_target THEN
        UPDATE ium_students SET family_group = v_target
         WHERE family_group = v_fg_b AND del_yn = 'N';
    END IF;

    SELECT v_target AS familyGroup;
END$$

CREATE PROCEDURE sp_ium_student_sibling_unlink(
    IN p_student_id BIGINT
)
BEGIN
    DECLARE v_fg BIGINT DEFAULT NULL;
    DECLARE v_cnt INT DEFAULT 0;

    SELECT family_group INTO v_fg FROM ium_students
     WHERE id = p_student_id AND del_yn = 'N';

    IF v_fg IS NOT NULL THEN
        UPDATE ium_students SET family_group = NULL
         WHERE id = p_student_id AND del_yn = 'N';

        -- 남은 구성원이 1명 뿐이라면 그룹 해체
        SELECT COUNT(*) INTO v_cnt FROM ium_students
         WHERE family_group = v_fg AND del_yn = 'N';
        IF v_cnt <= 1 THEN
            UPDATE ium_students SET family_group = NULL
             WHERE family_group = v_fg AND del_yn = 'N';
        END IF;
    END IF;

    SELECT ROW_COUNT() AS affected;
END$$

DELIMITER ;

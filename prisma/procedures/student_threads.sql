-- ============================================================
-- 이음 스레드 (I-UM Thread) 테이블 및 프로시저
-- 학생별 타임라인 이슈 트래커
-- ============================================================

-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS student_threads (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id  BIGINT        NOT NULL COMMENT '학생 ID (g5_member.mb_no)',
    writer_id   VARCHAR(20)   NOT NULL COMMENT '작성자 ID (g5_member.mb_id)',
    writer_name VARCHAR(50)   NOT NULL COMMENT '작성자 이름',
    content     TEXT          NOT NULL COMMENT '스레드 내용',
    tag         VARCHAR(20)   NOT NULL DEFAULT '일반' COMMENT '태그: 학습/태도/상담/일반',
    is_pinned   TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '상단 고정 여부',
    image_url   VARCHAR(500)  NULL COMMENT '첨부 이미지 URL',
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    del_yn      CHAR(1)       NOT NULL DEFAULT 'N',
    INDEX idx_student_id (student_id),
    INDEX idx_tag (tag),
    INDEX idx_pinned (is_pinned DESC, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='이음 스레드 - 학생별 타임라인';

-- ============================================================
-- 2. 학생 목록 조회 (스레드용 간략 프로필)
-- ============================================================
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS sp_thread_get_students()
BEGIN
    SELECT
        mb_no   AS id,
        mb_id   AS mbId,
        mb_name AS name,
        mb_level AS level
    FROM g5_member
    WHERE del_yn = 'N'
      AND mb_level <= 2
    ORDER BY mb_name;
END$$

DELIMITER ;

-- ============================================================
-- 3. 스레드 목록 조회 (학생ID 기준, 태그 필터 가능)
--    고정 포스트 먼저 → 최신순
-- ============================================================
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS sp_thread_list(
    IN p_student_id BIGINT,
    IN p_tag        VARCHAR(20)
)
BEGIN
    SELECT
        t.id,
        t.student_id  AS studentId,
        t.writer_id   AS writerId,
        t.writer_name AS writerName,
        t.content,
        t.tag,
        t.is_pinned   AS isPinned,
        t.image_url   AS imageUrl,
        t.created_at  AS createdAt,
        t.updated_at  AS updatedAt
    FROM student_threads t
    WHERE t.student_id = p_student_id
      AND t.del_yn = 'N'
      AND (p_tag IS NULL OR p_tag = '' OR t.tag = p_tag)
    ORDER BY t.is_pinned DESC, t.created_at DESC;
END$$

DELIMITER ;

-- ============================================================
-- 4. 스레드 작성
-- ============================================================
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS sp_thread_create(
    IN p_student_id  BIGINT,
    IN p_writer_id   VARCHAR(20),
    IN p_writer_name VARCHAR(50),
    IN p_content     TEXT,
    IN p_tag         VARCHAR(20),
    IN p_image_url   VARCHAR(500)
)
BEGIN
    INSERT INTO student_threads
        (student_id, writer_id, writer_name, content, tag, image_url)
    VALUES
        (p_student_id, p_writer_id, p_writer_name, p_content, p_tag, p_image_url);

    SELECT LAST_INSERT_ID() AS id;
END$$

DELIMITER ;

-- ============================================================
-- 5. 스레드 수정
-- ============================================================
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS sp_thread_update(
    IN p_id      BIGINT,
    IN p_content TEXT,
    IN p_tag     VARCHAR(20)
)
BEGIN
    UPDATE student_threads
    SET content = p_content,
        tag     = p_tag
    WHERE id = p_id AND del_yn = 'N';

    SELECT ROW_COUNT() AS affected;
END$$

DELIMITER ;

-- ============================================================
-- 6. 스레드 삭제 (소프트 삭제)
-- ============================================================
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS sp_thread_delete(
    IN p_id BIGINT
)
BEGIN
    UPDATE student_threads
    SET del_yn = 'Y'
    WHERE id = p_id;

    SELECT ROW_COUNT() AS affected;
END$$

DELIMITER ;

-- ============================================================
-- 7. 고정/고정 해제 토글
-- ============================================================
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS sp_thread_toggle_pin(
    IN p_id BIGINT
)
BEGIN
    UPDATE student_threads
    SET is_pinned = IF(is_pinned = 1, 0, 1)
    WHERE id = p_id AND del_yn = 'N';

    SELECT is_pinned AS isPinned
    FROM student_threads
    WHERE id = p_id;
END$$

DELIMITER ;

-- ============================================================
-- 게이미피케이션 시스템 테이블 및 프로시저
-- 포인트 적립/배지 관리/자동 트리거
-- ============================================================

-- 1. 포인트 잔액 테이블
CREATE TABLE IF NOT EXISTS gami_point_balance (
    student_id   BIGINT       PRIMARY KEY COMMENT '학생 ID (g5_member.mb_no)',
    total_point  INT          NOT NULL DEFAULT 0 COMMENT '누적 포인트',
    used_point   INT          NOT NULL DEFAULT 0 COMMENT '사용 포인트',
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='학생별 포인트 잔액';

-- 2. 포인트 히스토리 테이블
CREATE TABLE IF NOT EXISTS gami_point_history (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id   BIGINT       NOT NULL,
    point_amount INT          NOT NULL COMMENT '양수=적립, 음수=차감',
    reason_code  VARCHAR(30)  NOT NULL COMMENT 'ATTENDANCE / ASSIGNMENT_A / MANUAL / ...',
    reason_text  VARCHAR(200) NOT NULL COMMENT '표시용 사유',
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_student (student_id, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='포인트 적립/차감 히스토리';

-- 3. 배지 마스터 테이블
CREATE TABLE IF NOT EXISTS gami_badge_master (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    badge_code   VARCHAR(30)  NOT NULL UNIQUE COMMENT '배지 코드',
    badge_name   VARCHAR(50)  NOT NULL COMMENT '배지 이름',
    badge_desc   VARCHAR(200) NOT NULL COMMENT '배지 설명',
    badge_icon   VARCHAR(30)  NOT NULL DEFAULT 'Award' COMMENT 'Lucide 아이콘명',
    badge_color  VARCHAR(20)  NOT NULL DEFAULT 'amber' COMMENT '색상 키워드',
    req_point    INT          NULL COMMENT '자동 부여 기준 포인트 (NULL=수동)',
    sort_order   INT          NOT NULL DEFAULT 0,
    del_yn       CHAR(1)      NOT NULL DEFAULT 'N'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='배지 마스터';

-- 4. 학생별 획득 배지
CREATE TABLE IF NOT EXISTS gami_student_badge (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id   BIGINT       NOT NULL,
    badge_id     INT          NOT NULL,
    earned_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_student_badge (student_id, badge_id),
    INDEX idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='학생별 획득 배지';

-- ============================================================
-- 초기 배지 데이터 삽입 (중복 시 무시)
-- ============================================================
INSERT IGNORE INTO gami_badge_master (badge_code, badge_name, badge_desc, badge_icon, badge_color, req_point, sort_order) VALUES
('FIRST_STEP',   '첫 걸음',     '첫 포인트를 획득했어요!',        'Footprints', 'emerald',  1,    1),
('DILIGENT_50',  '성실한 학생',  '50포인트를 달성했어요!',         'BookOpen',   'blue',     50,   2),
('RISING_STAR',  '떠오르는 별',  '200포인트를 달성했어요!',        'Star',       'amber',    200,  3),
('CHAMPION',     '챔피언',       '500포인트를 달성했어요!',        'Trophy',     'orange',   500,  4),
('LEGEND',       '레전드',       '1000포인트를 달성했어요!',       'Crown',      'purple',   1000, 5),
('PERFECT_WEEK', '개근왕',       '1주일 연속 출석을 달성했어요!',  'Calendar',   'rose',     NULL, 6),
('TOP_SCORE',    '만점왕',       '테스트에서 만점을 받았어요!',    'Target',     'red',      NULL, 7);

-- ============================================================
-- 5. 포인트 트리거 프로시저 — 출결 완료 시 자동 적립 (10p)
-- ============================================================
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS sp_gami_trigger_attendance(
    IN p_student_id BIGINT
)
BEGIN
    -- 포인트 적립
    INSERT INTO gami_point_history (student_id, point_amount, reason_code, reason_text)
    VALUES (p_student_id, 10, 'ATTENDANCE', '출결 완료 포인트 (+10)');

    INSERT INTO gami_point_balance (student_id, total_point)
    VALUES (p_student_id, 10)
    ON DUPLICATE KEY UPDATE total_point = total_point + 10;

    -- 포인트 기준 배지 자동 부여
    INSERT IGNORE INTO gami_student_badge (student_id, badge_id)
    SELECT p_student_id, bm.id
    FROM gami_badge_master bm
    JOIN gami_point_balance pb ON pb.student_id = p_student_id
    WHERE bm.req_point IS NOT NULL
      AND bm.del_yn = 'N'
      AND pb.total_point >= bm.req_point;

    SELECT pb.total_point AS totalPoint, 10 AS earned
    FROM gami_point_balance pb
    WHERE pb.student_id = p_student_id;
END$$

DELIMITER ;

-- ============================================================
-- 6. 포인트 트리거 프로시저 — 과제 A등급 시 자동 적립 (50p)
-- ============================================================
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS sp_gami_trigger_assignment_a(
    IN p_student_id BIGINT
)
BEGIN
    INSERT INTO gami_point_history (student_id, point_amount, reason_code, reason_text)
    VALUES (p_student_id, 50, 'ASSIGNMENT_A', '과제 A등급 포인트 (+50)');

    INSERT INTO gami_point_balance (student_id, total_point)
    VALUES (p_student_id, 50)
    ON DUPLICATE KEY UPDATE total_point = total_point + 50;

    INSERT IGNORE INTO gami_student_badge (student_id, badge_id)
    SELECT p_student_id, bm.id
    FROM gami_badge_master bm
    JOIN gami_point_balance pb ON pb.student_id = p_student_id
    WHERE bm.req_point IS NOT NULL
      AND bm.del_yn = 'N'
      AND pb.total_point >= bm.req_point;

    SELECT pb.total_point AS totalPoint, 50 AS earned
    FROM gami_point_balance pb
    WHERE pb.student_id = p_student_id;
END$$

DELIMITER ;

-- ============================================================
-- 7. 수동 포인트 지급/차감
-- ============================================================
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS sp_gami_manual_point(
    IN p_student_id  BIGINT,
    IN p_amount      INT,
    IN p_reason_text VARCHAR(200)
)
BEGIN
    INSERT INTO gami_point_history (student_id, point_amount, reason_code, reason_text)
    VALUES (p_student_id, p_amount, 'MANUAL', p_reason_text);

    INSERT INTO gami_point_balance (student_id, total_point)
    VALUES (p_student_id, GREATEST(p_amount, 0))
    ON DUPLICATE KEY UPDATE total_point = total_point + p_amount;

    INSERT IGNORE INTO gami_student_badge (student_id, badge_id)
    SELECT p_student_id, bm.id
    FROM gami_badge_master bm
    JOIN gami_point_balance pb ON pb.student_id = p_student_id
    WHERE bm.req_point IS NOT NULL
      AND bm.del_yn = 'N'
      AND pb.total_point >= bm.req_point;

    SELECT pb.total_point AS totalPoint
    FROM gami_point_balance pb
    WHERE pb.student_id = p_student_id;
END$$

DELIMITER ;

-- ============================================================
-- 8. 수동 배지 부여
-- ============================================================
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS sp_gami_grant_badge(
    IN p_student_id BIGINT,
    IN p_badge_code VARCHAR(30)
)
BEGIN
    INSERT IGNORE INTO gami_student_badge (student_id, badge_id)
    SELECT p_student_id, id FROM gami_badge_master WHERE badge_code = p_badge_code AND del_yn = 'N';

    SELECT ROW_COUNT() AS granted;
END$$

DELIMITER ;

-- ============================================================
-- 9. 학생 대시보드 — 포인트 잔액 조회
-- ============================================================
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS sp_gami_get_balance(
    IN p_student_id BIGINT
)
BEGIN
    SELECT
        COALESCE(pb.total_point, 0) AS totalPoint,
        COALESCE(pb.used_point, 0)  AS usedPoint,
        COALESCE(pb.total_point, 0) - COALESCE(pb.used_point, 0) AS currentPoint
    FROM gami_point_balance pb
    WHERE pb.student_id = p_student_id;
END$$

DELIMITER ;

-- ============================================================
-- 10. 학생 대시보드 — 포인트 히스토리 (최근 50건)
-- ============================================================
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS sp_gami_get_history(
    IN p_student_id BIGINT
)
BEGIN
    SELECT
        h.id,
        h.point_amount AS pointAmount,
        h.reason_code  AS reasonCode,
        h.reason_text  AS reasonText,
        h.created_at   AS createdAt
    FROM gami_point_history h
    WHERE h.student_id = p_student_id
    ORDER BY h.created_at DESC
    LIMIT 50;
END$$

DELIMITER ;

-- ============================================================
-- 11. 학생 대시보드 — 획득 배지 목록
-- ============================================================
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS sp_gami_get_student_badges(
    IN p_student_id BIGINT
)
BEGIN
    SELECT
        bm.id          AS badgeId,
        bm.badge_code  AS badgeCode,
        bm.badge_name  AS badgeName,
        bm.badge_desc  AS badgeDesc,
        bm.badge_icon  AS badgeIcon,
        bm.badge_color AS badgeColor,
        sb.earned_at   AS earnedAt
    FROM gami_student_badge sb
    JOIN gami_badge_master bm ON bm.id = sb.badge_id
    WHERE sb.student_id = p_student_id
      AND bm.del_yn = 'N'
    ORDER BY sb.earned_at DESC;
END$$

DELIMITER ;

-- ============================================================
-- 12. 전체 배지 마스터 목록 (관리용)
-- ============================================================
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS sp_gami_get_all_badges()
BEGIN
    SELECT
        id          AS badgeId,
        badge_code  AS badgeCode,
        badge_name  AS badgeName,
        badge_desc  AS badgeDesc,
        badge_icon  AS badgeIcon,
        badge_color AS badgeColor,
        req_point   AS reqPoint,
        sort_order  AS sortOrder
    FROM gami_badge_master
    WHERE del_yn = 'N'
    ORDER BY sort_order;
END$$

DELIMITER ;

-- ============================================================
-- 13. 학생 목록 (게이미피케이션 대시보드용 — 포인트 포함)
-- ============================================================
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS sp_gami_get_students()
BEGIN
    SELECT
        m.mb_no   AS id,
        m.mb_id   AS mbId,
        m.mb_name AS name,
        COALESCE(pb.total_point, 0) AS totalPoint,
        (SELECT COUNT(*) FROM gami_student_badge sb WHERE sb.student_id = m.mb_no) AS badgeCount
    FROM g5_member m
    LEFT JOIN gami_point_balance pb ON pb.student_id = m.mb_no
    WHERE m.del_yn = 'N'
      AND m.mb_level <= 2
    ORDER BY COALESCE(pb.total_point, 0) DESC, m.mb_name;
END$$

DELIMITER ;

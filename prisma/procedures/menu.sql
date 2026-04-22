-- ============================================================
-- 사이드바 메뉴: auto_menu 테이블 + get_menu 프로시저
-- 앱(layout)에서 CALL get_menu(userLevel) 사용 — DB에 한 번 실행 필요
-- ============================================================

CREATE TABLE IF NOT EXISTS `auto_menu` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `menu_id` VARCHAR(50) NOT NULL UNIQUE COMMENT '메뉴 식별자',
    `title` VARCHAR(100) NOT NULL COMMENT '메뉴 제목',
    `href` VARCHAR(255) NULL COMMENT '링크 경로 (폴더면 NULL)',
    `icon` VARCHAR(50) NULL COMMENT 'lucide-react 아이콘명',
    `parent_id` INT NULL COMMENT '부모 메뉴 ID',
    `sort_order` INT NOT NULL DEFAULT 0,
    `is_folder` CHAR(1) NOT NULL DEFAULT 'N' COMMENT 'Y/N',
    `is_active` CHAR(1) NOT NULL DEFAULT 'Y' COMMENT 'Y/N',
    `required_level` INT NOT NULL DEFAULT 0 COMMENT '필요 권한 레벨(이하 허용)',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_parent_id` (`parent_id`),
    INDEX `idx_sort_order` (`sort_order`),
    INDEX `idx_is_active` (`is_active`),
    INDEX `idx_is_folder` (`is_folder`),
    CONSTRAINT `fk_auto_menu_parent` FOREIGN KEY (`parent_id`) REFERENCES `auto_menu`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사이드바 메뉴';

-- 시드: 폴더 먼저 → 하위 메뉴 (FK 순서)
INSERT INTO `auto_menu` (`menu_id`, `title`, `href`, `icon`, `parent_id`, `sort_order`, `is_folder`, `is_active`, `required_level`) VALUES
('ium-home', '경영/홈', '/', 'LayoutDashboard', NULL, 1, 'N', 'Y', 0),
('ium-crm', '원생 관리 (CRM)', NULL, 'Users', NULL, 2, 'Y', 'Y', 0),
('ium-lms', '학습 관리 (LMS)', NULL, 'GraduationCap', NULL, 3, 'Y', 'Y', 0),
('ium-erp', '수납/재무 (ERP)', NULL, 'CreditCard', NULL, 4, 'Y', 'Y', 0),
('ium-hrm', '강사/인사 (HRM)', NULL, 'UserCog', NULL, 5, 'Y', 'Y', 0),
('ium-admin', '시설/안심', NULL, 'Building2', NULL, 6, 'Y', 'Y', 0)
ON DUPLICATE KEY UPDATE
    `title` = VALUES(`title`),
    `href` = VALUES(`href`),
    `icon` = VALUES(`icon`),
    `sort_order` = VALUES(`sort_order`),
    `is_folder` = VALUES(`is_folder`),
    `is_active` = VALUES(`is_active`),
    `required_level` = VALUES(`required_level`);

SET @pid_crm = (SELECT id FROM auto_menu WHERE menu_id = 'ium-crm' LIMIT 1);
SET @pid_lms = (SELECT id FROM auto_menu WHERE menu_id = 'ium-lms' LIMIT 1);
SET @pid_erp = (SELECT id FROM auto_menu WHERE menu_id = 'ium-erp' LIMIT 1);
SET @pid_hrm = (SELECT id FROM auto_menu WHERE menu_id = 'ium-hrm' LIMIT 1);
SET @pid_admin = (SELECT id FROM auto_menu WHERE menu_id = 'ium-admin' LIMIT 1);

INSERT INTO `auto_menu` (`menu_id`, `title`, `href`, `icon`, `parent_id`, `sort_order`, `is_folder`, `is_active`, `required_level`) VALUES
('ium-crm-prospects', '가망/상담', '/crm/prospects', 'UserPlus', @pid_crm, 1, 'N', 'Y', 0),
('ium-crm-students', '재원생 명부', '/crm/students', 'Users', @pid_crm, 2, 'N', 'Y', 0),
('ium-crm-threads', '이음 스레드', '/crm/threads', 'MessageSquare', @pid_crm, 3, 'N', 'Y', 0),
('ium-lms-att', '출결 관리', '/lms/attendance', 'CheckCircle', @pid_lms, 1, 'N', 'Y', 0),
('ium-lms-curr', '수업/진도', '/lms/curriculum', 'BookOpen', @pid_lms, 2, 'N', 'Y', 0),
('ium-lms-grade', '성적 관리', '/lms/grades', 'BarChart3', @pid_lms, 3, 'N', 'Y', 0),
('ium-lms-gami', '게이미피케이션', '/lms/gamification', 'Star', @pid_lms, 4, 'N', 'Y', 0),
('ium-erp-bill', '청구/수납', '/erp/billing', 'Receipt', @pid_erp, 1, 'N', 'Y', 0),
('ium-erp-over', '미납자 관리', '/erp/overdue', 'AlertTriangle', @pid_erp, 2, 'N', 'Y', 0),
('ium-erp-acc', '지출/결산', '/erp/accounting', 'Calculator', @pid_erp, 3, 'N', 'Y', 0),
('ium-hrm-teach', '강사/근태', '/hrm/teachers', 'User', @pid_hrm, 1, 'N', 'Y', 0),
('ium-hrm-sch', '시간표', '/hrm/schedule', 'CalendarDays', @pid_hrm, 2, 'N', 'Y', 0),
('ium-ad-shuttle', '셔틀버스', '/admin/shuttle', 'Bus', @pid_admin, 1, 'N', 'Y', 0),
('ium-ad-fac', '강의실/재고', '/admin/facilities', 'Package', @pid_admin, 2, 'N', 'Y', 0),
('ium-ad-users', '사용자 관리', '/admin/users', 'Shield', @pid_admin, 3, 'N', 'Y', 10),
('ium-ad-notif', '알림 관리', '/admin/notifications', 'Bell', @pid_admin, 4, 'N', 'Y', 10),
('ium-ad-academies', '학원(소속) 관리', '/admin/academies', 'School', @pid_admin, 5, 'N', 'Y', 10)
ON DUPLICATE KEY UPDATE
    `title` = VALUES(`title`),
    `href` = VALUES(`href`),
    `icon` = VALUES(`icon`),
    `parent_id` = VALUES(`parent_id`),
    `sort_order` = VALUES(`sort_order`),
    `is_folder` = VALUES(`is_folder`),
    `is_active` = VALUES(`is_active`),
    `required_level` = VALUES(`required_level`);

DROP PROCEDURE IF EXISTS get_menu;

DELIMITER $$

CREATE PROCEDURE get_menu(
    IN p_user_level INT
)
BEGIN
    SELECT
        id AS id,
        menu_id AS menu_id,
        title AS title,
        href AS href,
        icon AS icon,
        parent_id AS parent_id,
        sort_order AS sort_order,
        is_folder AS is_folder,
        is_active AS is_active,
        required_level AS required_level,
        created_at AS created_at,
        updated_at AS updated_at
    FROM auto_menu
    WHERE
        is_active = 'Y'
        AND (p_user_level IS NULL OR required_level <= p_user_level)
    ORDER BY
        COALESCE(parent_id, 0), sort_order ASC;
END$$

DELIMITER ;

-- ============================================================
-- 사이드바 메뉴: ium_menu + get_menu
-- 구조: 프로젝트_개발상태_분류.md 파트 A (1~7) + 학원 설정 + 시스템 관리
-- menu_id·href·폴더 경로 일치 (href = 앱 라우트)
-- ============================================================

CREATE TABLE IF NOT EXISTS `ium_menu` (
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
    CONSTRAINT `fk_ium_menu_parent` FOREIGN KEY (`parent_id`) REFERENCES `ium_menu`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사이드바 메뉴';

-- 최상위: 7(문서 순서) + 학원 설정 + 시스템 관리
INSERT INTO `ium_menu` (`menu_id`, `title`, `href`, `icon`, `parent_id`, `sort_order`, `is_folder`, `is_active`, `required_level`) VALUES
('ium-home', '원장 대시보드', '/', 'LayoutDashboard', NULL, 1, 'N', 'Y', 0),
('ium-system-dashboard', '시스템 대시보드', '/', 'MonitorCog', NULL, 1, 'N', 'Y', 10),
('ium-admission', '입학·원생 관리', NULL, 'Users', NULL, 2, 'Y', 'Y', 0),
('ium-classes', '수업·학습 관리', NULL, 'GraduationCap', NULL, 3, 'Y', 'Y', 0),
('ium-faculty', '강사·업무', NULL, 'UserCog', NULL, 4, 'Y', 'Y', 0),
('ium-tuition', '수강료·결산', NULL, 'CreditCard', NULL, 5, 'Y', 'Y', 0),
('ium-campus', '강의실·차량', NULL, 'Building2', NULL, 6, 'Y', 'Y', 0),
('ium-comm', '학생·학부모 소통', NULL, 'MessagesSquare', NULL, 7, 'Y', 'Y', 0),
('ium-settings', '학원 설정', NULL, 'Settings', NULL, 8, 'Y', 'Y', 9),
('ium-system', '시스템 관리', NULL, 'Shield', NULL, 9, 'Y', 'Y', 10)
ON DUPLICATE KEY UPDATE
    `title` = VALUES(`title`),
    `href` = VALUES(`href`),
    `icon` = VALUES(`icon`),
    `sort_order` = VALUES(`sort_order`),
    `is_folder` = VALUES(`is_folder`),
    `is_active` = VALUES(`is_active`),
    `required_level` = VALUES(`required_level`);

SET @pid_admission = (SELECT id FROM ium_menu WHERE menu_id = 'ium-admission' LIMIT 1);
SET @pid_classes = (SELECT id FROM ium_menu WHERE menu_id = 'ium-classes' LIMIT 1);
SET @pid_faculty = (SELECT id FROM ium_menu WHERE menu_id = 'ium-faculty' LIMIT 1);
SET @pid_tuition = (SELECT id FROM ium_menu WHERE menu_id = 'ium-tuition' LIMIT 1);
SET @pid_campus = (SELECT id FROM ium_menu WHERE menu_id = 'ium-campus' LIMIT 1);
SET @pid_comm = (SELECT id FROM ium_menu WHERE menu_id = 'ium-comm' LIMIT 1);
SET @pid_settings = (SELECT id FROM ium_menu WHERE menu_id = 'ium-settings' LIMIT 1);
SET @pid_system = (SELECT id FROM ium_menu WHERE menu_id = 'ium-system' LIMIT 1);

INSERT INTO `ium_menu` (`menu_id`, `title`, `href`, `icon`, `parent_id`, `sort_order`, `is_folder`, `is_active`, `required_level`) VALUES
-- 1 입학·원생
('ium-admission-consultation', '입학 상담', '/admission/consultation', 'UserPlus', @pid_admission, 1, 'N', 'Y', 0),
('ium-admission-students', '재원생 명부', '/admission/students', 'Users', @pid_admission, 2, 'N', 'Y', 0),
-- 2 수업·학습
('ium-classes-attendance', '출결 관리', '/classes/attendance', 'CheckCircle', @pid_classes, 1, 'N', 'Y', 0),
('ium-classes-curriculum', '수업 진도', '/classes/curriculum', 'BookOpen', @pid_classes, 2, 'N', 'Y', 0),
('ium-classes-grades', '성적 관리', '/classes/grades', 'BarChart3', @pid_classes, 3, 'N', 'Y', 0),
('ium-classes-rewards', '포인트·보상', '/classes/rewards', 'Star', @pid_classes, 4, 'N', 'Y', 0),
-- 3 강사·업무
('ium-faculty-teachers', '강사·근태', '/faculty/teachers', 'User', @pid_faculty, 1, 'N', 'Y', 0),
('ium-faculty-schedule', '시간표', '/faculty/schedule', 'CalendarDays', @pid_faculty, 2, 'N', 'Y', 0),
-- 4 수강료·결산
('ium-tuition-billing', '수강료 청구·수납', '/tuition/billing', 'Receipt', @pid_tuition, 1, 'N', 'Y', 0),
('ium-tuition-overdue', '미납 관리', '/tuition/overdue', 'AlertTriangle', @pid_tuition, 2, 'N', 'Y', 0),
('ium-tuition-expenses', '지출·결산', '/tuition/expenses', 'Calculator', @pid_tuition, 3, 'N', 'Y', 0),
-- 5 강의실·차량
('ium-campus-facilities', '강의실·재고', '/campus/facilities', 'Package', @pid_campus, 1, 'N', 'Y', 0),
('ium-campus-shuttle', '셔틀 운행', '/campus/shuttle', 'Bus', @pid_campus, 2, 'N', 'Y', 0),
-- 6 소통
('ium-comm-notifications', '알림 관리', '/comm/notifications', 'Bell', @pid_comm, 1, 'N', 'Y', 10),
('ium-comm-threads', '이음 스레드', '/comm/threads', 'MessageSquare', @pid_comm, 2, 'N', 'Y', 0),
-- 학원 설정
('ium-settings-users', '학원 사용자 관리', '/settings/users', 'UsersRound', @pid_settings, 1, 'N', 'Y', 9),
-- 시스템 관리
('ium-system-traffic', '트래픽 현황', '/system/traffic', 'Activity', @pid_system, 1, 'N', 'Y', 10),
('ium-system-logs', '사용 로그', '/system/logs', 'FileSearch', @pid_system, 2, 'N', 'Y', 10),
('ium-system-academies', '학원 등록·관리', '/system/academies', 'School', @pid_system, 3, 'N', 'Y', 10),
('ium-system-admins', '학원관리자 지정', '/system/admins', 'ShieldCheck', @pid_system, 4, 'N', 'Y', 10)
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
    FROM ium_menu
    WHERE
        is_active = 'Y'
        AND (
            CASE
                WHEN p_user_level = 10 THEN
                    menu_id = 'ium-system-dashboard'
                    OR menu_id = 'ium-system'
                    OR parent_id = (SELECT id FROM ium_menu WHERE menu_id = 'ium-system' LIMIT 1)
                ELSE
                    p_user_level IS NULL OR required_level <= p_user_level
            END
        )
    ORDER BY
        COALESCE(parent_id, 0), sort_order ASC;
END$$

DELIMITER ;

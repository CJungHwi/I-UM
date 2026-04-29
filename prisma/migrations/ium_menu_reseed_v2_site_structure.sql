-- =============================================================================
-- I-UM ium_menu 재시드 (사이트맵 v2) — 기존 menu.sql / alter_menu_titles_academy.sql 재활용
-- =============================================================================
-- 목적
--   - `menu_id`·`href`는 앱 라우트·`src/lib/menu.ts`·`get_menu` 프로시저와 동일하게 유지
--   - 폴더 `title`·`icon`·최상위 `sort_order`만 "경영·홈 → … → 시스템 관리" 순으로 정리
--   - 하위 메뉴 제목은 기획 표현에 맞게 소폭 조정 (경로 불변)
--
-- 실행
--   - 기존 DB: 그대로 실행 (ON DUPLICATE KEY UPDATE 로 갱신)
--   - 빈 테이블: `prisma/procedures/menu.sql` 선행 후 실행해도 됨. 단독 실행 시에도 본 파일이 폴더·자식을 채움
--
-- 주의
--   - `get_menu` 내부 CASE는 `menu_id = 'ium-system'`·`'ium-system-dashboard'` 하드코딩 — 변경 금지
--   - 다른 프로젝트 시드(`dashboard`, `sales` 등)가 남아 있으면 별도 정리 (본 스크립트는 건드리지 않음)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) 최상위 (폴더 + 홈 + 시스템 대시보드)
-- ---------------------------------------------------------------------------
INSERT INTO `ium_menu` (`menu_id`, `title`, `href`, `icon`, `parent_id`, `sort_order`, `is_folder`, `is_active`, `required_level`) VALUES
('ium-home', '경영·홈', '/', 'LayoutDashboard', NULL, 1, 'N', 'Y', 0),
('ium-admission', '원생 관리', NULL, 'Users', NULL, 2, 'Y', 'Y', 0),
('ium-classes', '학습 관리', NULL, 'GraduationCap', NULL, 3, 'Y', 'Y', 0),
('ium-faculty', '강사·인사', NULL, 'UserCog', NULL, 4, 'Y', 'Y', 0),
('ium-tuition', '수납·재무', NULL, 'CreditCard', NULL, 5, 'Y', 'Y', 0),
('ium-campus', '시설·안심', NULL, 'Building2', NULL, 6, 'Y', 'Y', 0),
('ium-comm', '학부모·학생 소통', NULL, 'MessagesSquare', NULL, 7, 'Y', 'Y', 0),
('ium-settings', '학원 설정', NULL, 'Settings', NULL, 8, 'Y', 'Y', 9),
('ium-system', '시스템 관리', NULL, 'Shield', NULL, 9, 'Y', 'Y', 10),
('ium-system-dashboard', '시스템 홈', '/', 'MonitorCog', NULL, 10, 'N', 'Y', 10)
ON DUPLICATE KEY UPDATE
    `title` = VALUES(`title`),
    `href` = VALUES(`href`),
    `icon` = VALUES(`icon`),
    `parent_id` = VALUES(`parent_id`),
    `sort_order` = VALUES(`sort_order`),
    `is_folder` = VALUES(`is_folder`),
    `is_active` = VALUES(`is_active`),
    `required_level` = VALUES(`required_level`);

-- ---------------------------------------------------------------------------
-- 2) 부모 id (기존 menu.sql 패턴)
-- ---------------------------------------------------------------------------
SET @pid_admission = (SELECT id FROM ium_menu WHERE menu_id = 'ium-admission' LIMIT 1);
SET @pid_classes = (SELECT id FROM ium_menu WHERE menu_id = 'ium-classes' LIMIT 1);
SET @pid_faculty = (SELECT id FROM ium_menu WHERE menu_id = 'ium-faculty' LIMIT 1);
SET @pid_tuition = (SELECT id FROM ium_menu WHERE menu_id = 'ium-tuition' LIMIT 1);
SET @pid_campus = (SELECT id FROM ium_menu WHERE menu_id = 'ium-campus' LIMIT 1);
SET @pid_comm = (SELECT id FROM ium_menu WHERE menu_id = 'ium-comm' LIMIT 1);
SET @pid_settings = (SELECT id FROM ium_menu WHERE menu_id = 'ium-settings' LIMIT 1);
SET @pid_system = (SELECT id FROM ium_menu WHERE menu_id = 'ium-system' LIMIT 1);

-- ---------------------------------------------------------------------------
-- 3) 하위 메뉴 (menu_id·href 동일 — 앱·이전 마이그레이션과 호환)
-- ---------------------------------------------------------------------------
INSERT INTO `ium_menu` (`menu_id`, `title`, `href`, `icon`, `parent_id`, `sort_order`, `is_folder`, `is_active`, `required_level`) VALUES
('ium-admission-consultation', '가망·입학 상담', '/admission/consultation', 'UserPlus', @pid_admission, 1, 'N', 'Y', 0),
('ium-admission-students', '재원생 명부', '/admission/students', 'Users', @pid_admission, 2, 'N', 'Y', 0),
('ium-classes-attendance', '출결 관리', '/classes/attendance', 'CheckCircle', @pid_classes, 1, 'N', 'Y', 0),
('ium-classes-curriculum', '수업·진도·과제', '/classes/curriculum', 'BookOpen', @pid_classes, 2, 'N', 'Y', 0),
('ium-classes-grades', '성적 관리', '/classes/grades', 'BarChart3', @pid_classes, 3, 'N', 'Y', 0),
('ium-classes-rewards', '포인트·보상', '/classes/rewards', 'Star', @pid_classes, 4, 'N', 'Y', 0),
('ium-faculty-teachers', '강사 프로필·근태', '/faculty/teachers', 'User', @pid_faculty, 1, 'N', 'Y', 0),
('ium-faculty-schedule', '수업 배정·시간표', '/faculty/schedule', 'CalendarDays', @pid_faculty, 2, 'N', 'Y', 0),
('ium-tuition-billing', '청구·수납·구독', '/tuition/billing', 'Receipt', @pid_tuition, 1, 'N', 'Y', 0),
('ium-tuition-overdue', '미납·독촉', '/tuition/overdue', 'AlertTriangle', @pid_tuition, 2, 'N', 'Y', 0),
('ium-tuition-expenses', '지출·결산', '/tuition/expenses', 'Calculator', @pid_tuition, 3, 'N', 'Y', 0),
('ium-campus-facilities', '강의실·재고', '/campus/facilities', 'Package', @pid_campus, 1, 'N', 'Y', 0),
('ium-campus-shuttle', '셔틀·안심 연동', '/campus/shuttle', 'Bus', @pid_campus, 2, 'N', 'Y', 0),
('ium-comm-notifications', '알림·공지', '/comm/notifications', 'Bell', @pid_comm, 1, 'N', 'Y', 10),
('ium-comm-threads', '이음 스레드', '/comm/threads', 'MessageSquare', @pid_comm, 2, 'N', 'Y', 0),
('ium-settings-users', '사용자·승인', '/settings/users', 'UsersRound', @pid_settings, 1, 'N', 'Y', 9),
('ium-settings-register', '회원가입(공개)', '/settings/register', 'UserPlus', @pid_settings, 2, 'N', 'N', 0),
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

-- ---------------------------------------------------------------------------
-- 4) 부모 연결 보정 (이전 DB에서 parent_id가 어긋난 경우)
-- ---------------------------------------------------------------------------
UPDATE `ium_menu` c
INNER JOIN `ium_menu` p ON p.menu_id = 'ium-admission'
SET c.parent_id = p.id
WHERE c.menu_id IN ('ium-admission-consultation', 'ium-admission-students');

UPDATE `ium_menu` c
INNER JOIN `ium_menu` p ON p.menu_id = 'ium-classes'
SET c.parent_id = p.id
WHERE c.menu_id IN (
    'ium-classes-attendance',
    'ium-classes-curriculum',
    'ium-classes-grades',
    'ium-classes-rewards'
);

UPDATE `ium_menu` c
INNER JOIN `ium_menu` p ON p.menu_id = 'ium-faculty'
SET c.parent_id = p.id
WHERE c.menu_id IN ('ium-faculty-teachers', 'ium-faculty-schedule');

UPDATE `ium_menu` c
INNER JOIN `ium_menu` p ON p.menu_id = 'ium-tuition'
SET c.parent_id = p.id
WHERE c.menu_id IN ('ium-tuition-billing', 'ium-tuition-overdue', 'ium-tuition-expenses');

UPDATE `ium_menu` c
INNER JOIN `ium_menu` p ON p.menu_id = 'ium-campus'
SET c.parent_id = p.id
WHERE c.menu_id IN ('ium-campus-facilities', 'ium-campus-shuttle');

UPDATE `ium_menu` c
INNER JOIN `ium_menu` p ON p.menu_id = 'ium-comm'
SET c.parent_id = p.id
WHERE c.menu_id IN ('ium-comm-notifications', 'ium-comm-threads');

UPDATE `ium_menu` c
INNER JOIN `ium_menu` p ON p.menu_id = 'ium-settings'
SET c.parent_id = p.id
WHERE c.menu_id IN ('ium-settings-users', 'ium-settings-register');

UPDATE `ium_menu` c
INNER JOIN `ium_menu` p ON p.menu_id = 'ium-system'
SET c.parent_id = p.id
WHERE c.menu_id IN (
    'ium-system-traffic',
    'ium-system-logs',
    'ium-system-academies',
    'ium-system-admins'
);

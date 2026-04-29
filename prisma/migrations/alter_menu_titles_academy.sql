-- I-UM ium_menu: 프로젝트_개발상태_분류.md 구조에 맞춘 menu_id·href 일괄 갱신
-- 기존 DB에 한 번 실행. 이미 신규 값이면 해당 WHERE는 0행입니다.
-- 복잡한 분기(구 CRM id 등)는 menu.sql 시드 재적용을 권장합니다.

-- 0) 구 ERP/약어 폴더 id → 신규 (자식 먼저)
UPDATE `ium_menu` SET `menu_id` = 'ium-admission-consultation' WHERE `menu_id` IN ('ium-enrollment-prospects', 'ium-crm-prospects');
UPDATE `ium_menu` SET `menu_id` = 'ium-admission-students' WHERE `menu_id` IN ('ium-enrollment-students', 'ium-crm-students');
UPDATE `ium_menu` SET `menu_id` = 'ium-comm-threads' WHERE `menu_id` IN ('ium-enrollment-threads', 'ium-crm-threads');
UPDATE `ium_menu` SET `menu_id` = 'ium-classes-attendance' WHERE `menu_id` IN ('ium-lms-att');
UPDATE `ium_menu` SET `menu_id` = 'ium-classes-curriculum' WHERE `menu_id` IN ('ium-lms-curr');
UPDATE `ium_menu` SET `menu_id` = 'ium-classes-grades' WHERE `menu_id` IN ('ium-lms-grade');
UPDATE `ium_menu` SET `menu_id` = 'ium-classes-rewards' WHERE `menu_id` IN ('ium-lms-gami', 'ium-classes-gami');
UPDATE `ium_menu` SET `menu_id` = 'ium-tuition-billing' WHERE `menu_id` IN ('ium-finance-billing', 'ium-erp-bill');
UPDATE `ium_menu` SET `menu_id` = 'ium-tuition-overdue' WHERE `menu_id` IN ('ium-finance-overdue', 'ium-erp-over');
UPDATE `ium_menu` SET `menu_id` = 'ium-tuition-expenses' WHERE `menu_id` IN ('ium-finance-accounting', 'ium-erp-acc');
UPDATE `ium_menu` SET `menu_id` = 'ium-faculty-teachers' WHERE `menu_id` IN ('ium-hrm-teach');
UPDATE `ium_menu` SET `menu_id` = 'ium-faculty-schedule' WHERE `menu_id` IN ('ium-hrm-sch');
UPDATE `ium_menu` SET `menu_id` = 'ium-campus-facilities' WHERE `menu_id` IN ('ium-operations-facilities', 'ium-ad-fac');
UPDATE `ium_menu` SET `menu_id` = 'ium-campus-shuttle' WHERE `menu_id` IN ('ium-operations-shuttle', 'ium-ad-shuttle');
UPDATE `ium_menu` SET `menu_id` = 'ium-comm-notifications' WHERE `menu_id` IN ('ium-operations-notifications', 'ium-ad-notif');
UPDATE `ium_menu` SET `menu_id` = 'ium-settings-users' WHERE `menu_id` IN ('ium-operations-users', 'ium-ad-users');
UPDATE `ium_menu` SET `menu_id` = 'ium-system-academies' WHERE `menu_id` IN ('ium-settings-academies', 'ium-operations-academies', 'ium-ad-academies');
UPDATE `ium_menu` SET `menu_id` = 'ium-settings-register' WHERE `menu_id` IN ('ium-operations-register');

UPDATE `ium_menu` SET `menu_id` = 'ium-admission' WHERE `menu_id` IN ('ium-enrollment', 'ium-crm');
UPDATE `ium_menu` SET `menu_id` = 'ium-classes' WHERE `menu_id` IN ('ium-lms');
UPDATE `ium_menu` SET `menu_id` = 'ium-tuition' WHERE `menu_id` IN ('ium-finance', 'ium-erp');
UPDATE `ium_menu` SET `menu_id` = 'ium-faculty' WHERE `menu_id` IN ('ium-hrm');
-- 구 「학원 운영」 폴더 → 캠퍼스(강의실·차량) 폴더. 알림·사용자 등은 아래 INSERT/UPDATE로 ium-comm·ium-settings로 옮김.
UPDATE `ium_menu` SET `menu_id` = 'ium-campus', `title` = '강의실·차량', `icon` = 'Building2' WHERE `menu_id` = 'ium-operations' AND `is_folder` = 'Y';

INSERT INTO `ium_menu` (`menu_id`, `title`, `href`, `icon`, `parent_id`, `sort_order`, `is_folder`, `is_active`, `required_level`)
SELECT 'ium-comm', '학생·학부모 소통', NULL, 'MessagesSquare', NULL, 7, 'Y', 'Y', 0
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM ium_menu WHERE menu_id = 'ium-comm');

INSERT INTO `ium_menu` (`menu_id`, `title`, `href`, `icon`, `parent_id`, `sort_order`, `is_folder`, `is_active`, `required_level`)
SELECT 'ium-settings', '학원 설정', NULL, 'Settings', NULL, 8, 'Y', 'Y', 9
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM ium_menu WHERE menu_id = 'ium-settings');

INSERT INTO `ium_menu` (`menu_id`, `title`, `href`, `icon`, `parent_id`, `sort_order`, `is_folder`, `is_active`, `required_level`)
SELECT 'ium-system', '시스템 관리', NULL, 'Shield', NULL, 9, 'Y', 'Y', 10
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM ium_menu WHERE menu_id = 'ium-system');

INSERT INTO `ium_menu` (`menu_id`, `title`, `href`, `icon`, `parent_id`, `sort_order`, `is_folder`, `is_active`, `required_level`)
SELECT 'ium-system-dashboard', '시스템 대시보드', '/', 'MonitorCog', NULL, 1, 'N', 'Y', 10
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM ium_menu WHERE menu_id = 'ium-system-dashboard');

-- 부모 id 재연결: comm·settings·system 하위의 parent_id를 새 폴더 id로
UPDATE `ium_menu` c
INNER JOIN `ium_menu` p ON p.menu_id = 'ium-comm'
SET c.parent_id = p.id
WHERE c.menu_id IN ('ium-comm-notifications', 'ium-comm-threads');

UPDATE `ium_menu` c
INNER JOIN `ium_menu` p ON p.menu_id = 'ium-settings'
SET c.parent_id = p.id
WHERE c.menu_id IN ('ium-settings-users');

UPDATE `ium_menu` c
INNER JOIN `ium_menu` p ON p.menu_id = 'ium-system'
SET c.parent_id = p.id
WHERE c.menu_id IN ('ium-system-traffic', 'ium-system-logs', 'ium-system-academies', 'ium-system-admins');

UPDATE `ium_menu` c
INNER JOIN `ium_menu` p ON p.menu_id = 'ium-campus'
SET c.parent_id = p.id
WHERE c.menu_id IN ('ium-campus-facilities', 'ium-campus-shuttle');

-- 1) href (문서·폴더 구조와 동일)
UPDATE `ium_menu` SET `title` = '원장 대시보드', `href` = '/' WHERE `menu_id` = 'ium-home';
UPDATE `ium_menu` SET `title` = '시스템 대시보드', `href` = '/', `icon` = 'MonitorCog', `parent_id` = NULL, `sort_order` = 1, `is_active` = 'Y', `required_level` = 10 WHERE `menu_id` = 'ium-system-dashboard';
UPDATE `ium_menu` SET `title` = '입학·원생 관리', `href` = NULL WHERE `menu_id` = 'ium-admission';
UPDATE `ium_menu` SET `title` = '수업·학습 관리', `href` = NULL WHERE `menu_id` = 'ium-classes';
UPDATE `ium_menu` SET `title` = '강사·업무', `href` = NULL WHERE `menu_id` = 'ium-faculty';
UPDATE `ium_menu` SET `title` = '수강료·결산', `href` = NULL WHERE `menu_id` = 'ium-tuition';
UPDATE `ium_menu` SET `title` = '강의실·차량', `href` = NULL WHERE `menu_id` = 'ium-campus';
UPDATE `ium_menu` SET `title` = '학생·학부모 소통', `href` = NULL WHERE `menu_id` = 'ium-comm';
UPDATE `ium_menu` SET `title` = '학원 설정', `href` = NULL, `icon` = 'Settings', `required_level` = 9 WHERE `menu_id` = 'ium-settings';
UPDATE `ium_menu` SET `title` = '시스템 관리', `href` = NULL, `icon` = 'Shield', `required_level` = 10 WHERE `menu_id` = 'ium-system';

UPDATE `ium_menu` SET `title` = '입학 상담', `href` = '/admission/consultation' WHERE `menu_id` = 'ium-admission-consultation';
UPDATE `ium_menu` SET `title` = '재원생 명부', `href` = '/admission/students' WHERE `menu_id` = 'ium-admission-students';
UPDATE `ium_menu` SET `title` = '이음 스레드', `href` = '/comm/threads' WHERE `menu_id` = 'ium-comm-threads';
UPDATE `ium_menu` SET `title` = '출결 관리', `href` = '/classes/attendance' WHERE `menu_id` = 'ium-classes-attendance';
UPDATE `ium_menu` SET `title` = '수업 진도', `href` = '/classes/curriculum' WHERE `menu_id` = 'ium-classes-curriculum';
UPDATE `ium_menu` SET `title` = '성적 관리', `href` = '/classes/grades' WHERE `menu_id` = 'ium-classes-grades';
UPDATE `ium_menu` SET `title` = '포인트·보상', `href` = '/classes/rewards' WHERE `menu_id` = 'ium-classes-rewards';
UPDATE `ium_menu` SET `title` = '강사·근태', `href` = '/faculty/teachers' WHERE `menu_id` = 'ium-faculty-teachers';
UPDATE `ium_menu` SET `title` = '시간표', `href` = '/faculty/schedule' WHERE `menu_id` = 'ium-faculty-schedule';
UPDATE `ium_menu` SET `title` = '수강료 청구·수납', `href` = '/tuition/billing' WHERE `menu_id` = 'ium-tuition-billing';
UPDATE `ium_menu` SET `title` = '미납 관리', `href` = '/tuition/overdue' WHERE `menu_id` = 'ium-tuition-overdue';
UPDATE `ium_menu` SET `title` = '지출·결산', `href` = '/tuition/expenses' WHERE `menu_id` = 'ium-tuition-expenses';
UPDATE `ium_menu` SET `title` = '강의실·재고', `href` = '/campus/facilities' WHERE `menu_id` = 'ium-campus-facilities';
UPDATE `ium_menu` SET `title` = '셔틀 운행', `href` = '/campus/shuttle' WHERE `menu_id` = 'ium-campus-shuttle';
UPDATE `ium_menu` SET `title` = '알림 관리', `href` = '/comm/notifications' WHERE `menu_id` = 'ium-comm-notifications';
UPDATE `ium_menu` SET `title` = '학원 사용자 관리', `href` = '/settings/users', `icon` = 'UsersRound', `required_level` = 9 WHERE `menu_id` = 'ium-settings-users';
UPDATE `ium_menu` SET `title` = '회원가입(공개)', `href` = '/settings/register', `is_active` = 'N' WHERE `menu_id` = 'ium-settings-register';

INSERT INTO `ium_menu` (`menu_id`, `title`, `href`, `icon`, `parent_id`, `sort_order`, `is_folder`, `is_active`, `required_level`)
SELECT 'ium-system-traffic', '트래픽 현황', '/system/traffic', 'Activity', p.id, 1, 'N', 'Y', 10
FROM ium_menu p WHERE p.menu_id = 'ium-system'
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `href` = VALUES(`href`), `icon` = VALUES(`icon`), `parent_id` = VALUES(`parent_id`), `sort_order` = VALUES(`sort_order`), `is_folder` = VALUES(`is_folder`), `is_active` = VALUES(`is_active`), `required_level` = VALUES(`required_level`);

INSERT INTO `ium_menu` (`menu_id`, `title`, `href`, `icon`, `parent_id`, `sort_order`, `is_folder`, `is_active`, `required_level`)
SELECT 'ium-system-logs', '사용 로그', '/system/logs', 'FileSearch', p.id, 2, 'N', 'Y', 10
FROM ium_menu p WHERE p.menu_id = 'ium-system'
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `href` = VALUES(`href`), `icon` = VALUES(`icon`), `parent_id` = VALUES(`parent_id`), `sort_order` = VALUES(`sort_order`), `is_folder` = VALUES(`is_folder`), `is_active` = VALUES(`is_active`), `required_level` = VALUES(`required_level`);

INSERT INTO `ium_menu` (`menu_id`, `title`, `href`, `icon`, `parent_id`, `sort_order`, `is_folder`, `is_active`, `required_level`)
SELECT 'ium-system-academies', '학원 등록·관리', '/system/academies', 'School', p.id, 3, 'N', 'Y', 10
FROM ium_menu p WHERE p.menu_id = 'ium-system'
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `href` = VALUES(`href`), `icon` = VALUES(`icon`), `parent_id` = VALUES(`parent_id`), `sort_order` = VALUES(`sort_order`), `is_folder` = VALUES(`is_folder`), `is_active` = VALUES(`is_active`), `required_level` = VALUES(`required_level`);

INSERT INTO `ium_menu` (`menu_id`, `title`, `href`, `icon`, `parent_id`, `sort_order`, `is_folder`, `is_active`, `required_level`)
SELECT 'ium-system-admins', '학원관리자 지정', '/system/admins', 'ShieldCheck', p.id, 4, 'N', 'Y', 10
FROM ium_menu p WHERE p.menu_id = 'ium-system'
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `href` = VALUES(`href`), `icon` = VALUES(`icon`), `parent_id` = VALUES(`parent_id`), `sort_order` = VALUES(`sort_order`), `is_folder` = VALUES(`is_folder`), `is_active` = VALUES(`is_active`), `required_level` = VALUES(`required_level`);

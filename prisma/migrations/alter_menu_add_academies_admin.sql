-- 시스템 관리(ium-system / 구 ium-settings·ium-operations) 하위에 「학원 등록·관리」 메뉴 추가
-- 기존 DB에 한 번 실행. menu_id 충돌 시 ON DUPLICATE KEY 로 제목/경로만 갱신됩니다.

INSERT INTO ium_menu (menu_id, title, href, icon, parent_id, sort_order, is_folder, is_active, required_level)
SELECT 'ium-system', '시스템 관리', NULL, 'Shield', NULL, 9, 'Y', 'Y', 10
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM ium_menu WHERE menu_id = 'ium-system');

SET @pid_system = COALESCE(
    (SELECT id FROM ium_menu WHERE menu_id = 'ium-system' LIMIT 1),
    (SELECT id FROM ium_menu WHERE menu_id = 'ium-settings' LIMIT 1),
    (SELECT id FROM ium_menu WHERE menu_id = 'ium-operations' LIMIT 1),
    (SELECT id FROM ium_menu WHERE menu_id = 'ium-admin' LIMIT 1)
);

INSERT INTO ium_menu (
    menu_id,
    title,
    href,
    icon,
    parent_id,
    sort_order,
    is_folder,
    is_active,
    required_level
) VALUES (
    'ium-system-academies',
    '학원 등록·관리',
    '/system/academies',
    'School',
    @pid_system,
    3,
    'N',
    'Y',
    10
)
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    href = VALUES(href),
    icon = VALUES(icon),
    parent_id = VALUES(parent_id),
    sort_order = VALUES(sort_order),
    is_folder = VALUES(is_folder),
    is_active = VALUES(is_active),
    required_level = VALUES(required_level);

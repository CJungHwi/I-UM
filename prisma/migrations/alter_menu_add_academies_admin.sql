-- 시설/안심(ium-admin) 하위에 「학원(소속) 관리」 메뉴 추가
-- 기존 DB에 한 번 실행. menu_id 충돌 시 ON DUPLICATE KEY 로 제목/경로만 갱신됩니다.

SET @pid_admin = (SELECT id FROM auto_menu WHERE menu_id = 'ium-admin' LIMIT 1);

INSERT INTO auto_menu (
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
    'ium-ad-academies',
    '학원(소속) 관리',
    '/admin/academies',
    'School',
    @pid_admin,
    5,
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

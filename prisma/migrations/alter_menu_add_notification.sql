-- 알림 관리 메뉴 (시설/안심 폴더 하위)
-- auto_menu에 이미 ium-admin 폴더가 있을 때 실행하세요.

SET @pid_admin = (SELECT id FROM auto_menu WHERE menu_id = 'ium-admin' LIMIT 1);

INSERT INTO auto_menu (menu_id, title, href, icon, parent_id, sort_order, is_folder, is_active, required_level)
VALUES ('ium-ad-notif', '알림 관리', '/admin/notifications', 'Bell', @pid_admin, 4, 'N', 'Y', 10)
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    href = VALUES(href),
    icon = VALUES(icon),
    parent_id = VALUES(parent_id),
    sort_order = VALUES(sort_order),
    is_folder = VALUES(is_folder),
    is_active = VALUES(is_active),
    required_level = VALUES(required_level);

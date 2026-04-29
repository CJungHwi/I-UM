-- 알림 관리 메뉴 (학생·학부모 소통 폴더 하위)
-- ium_menu에 ium-comm 폴더가 있을 때 실행하세요. 구 스크립트는 ium-operations 하위였습니다.

SET @pid_comm = COALESCE(
    (SELECT id FROM ium_menu WHERE menu_id = 'ium-comm' LIMIT 1),
    (SELECT id FROM ium_menu WHERE menu_id = 'ium-operations' LIMIT 1),
    (SELECT id FROM ium_menu WHERE menu_id = 'ium-admin' LIMIT 1)
);

INSERT INTO ium_menu (menu_id, title, href, icon, parent_id, sort_order, is_folder, is_active, required_level)
VALUES ('ium-comm-notifications', '알림 관리', '/comm/notifications', 'Bell', @pid_comm, 4, 'N', 'Y', 10)
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    href = VALUES(href),
    icon = VALUES(icon),
    parent_id = VALUES(parent_id),
    sort_order = VALUES(sort_order),
    is_folder = VALUES(is_folder),
    is_active = VALUES(is_active),
    required_level = VALUES(required_level);

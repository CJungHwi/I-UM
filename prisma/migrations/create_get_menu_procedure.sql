-- 사용자 권한에 따른 메뉴 조회 프로시저
-- 파라미터: p_user_level (사용자 권한 레벨, NULL이면 전체 조회)
-- 활성화된 메뉴만 조회합니다.
-- SYSTEM_ADMIN(10)은 시스템 메뉴만, 나머지는 권한 레벨 이하 메뉴를 반환합니다.

DELIMITER $$

DROP PROCEDURE IF EXISTS get_menu$$

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

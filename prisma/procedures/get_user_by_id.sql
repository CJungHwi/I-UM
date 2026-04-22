-- 사용자 조회 프로시저 (인증용)
-- mb_id로 사용자를 찾고, 삭제되지 않은 사용자만 반환
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS get_user_by_id(
    IN p_mb_id VARCHAR(20)
)
BEGIN
    SELECT 
        mb_no AS id,
        mb_id,
        mb_password AS password,
        mb_name AS name,
        mb_email AS email,
        mb_level AS mbLevel
    FROM g5_member
    WHERE mb_id = p_mb_id
    AND del_yn = 'N';
END$$

DELIMITER ;

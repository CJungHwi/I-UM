-- 공통 코드 조회
-- 선행: prisma/migrations/20260430_student_code_tables.sql

DROP PROCEDURE IF EXISTS sp_ium_code_list;

DELIMITER $$

CREATE PROCEDURE sp_ium_code_list(IN p_code_type VARCHAR(40))
BEGIN
    SELECT
        c.code AS code,
        c.label AS label,
        c.sort_no AS sortNo,
        c.next_grade_code AS nextGradeCode
    FROM ium_code c
    WHERE c.code_type = p_code_type
      AND c.del_yn = 'N'
    ORDER BY c.sort_no ASC, c.code ASC;
END$$

DELIMITER ;

-- 기존 ium_menu 테이블에 폴더 기능 추가
-- href를 NULL 가능하게 변경하고 is_folder 컬럼 추가

-- 1. href 컬럼을 NULL 가능하게 변경
ALTER TABLE `ium_menu` 
MODIFY COLUMN `href` VARCHAR(255) NULL COMMENT '링크 경로 (폴더인 경우 NULL)';

-- 2. is_folder 컬럼 추가
ALTER TABLE `ium_menu` 
ADD COLUMN `is_folder` CHAR(1) NOT NULL DEFAULT 'N' COMMENT '폴더 여부 (Y/N)' AFTER `sort_order`;

-- 3. is_folder 인덱스 추가
ALTER TABLE `ium_menu` 
ADD INDEX `idx_is_folder` (`is_folder`);

-- 4. 기존 데이터는 모두 일반 메뉴로 설정 (is_folder = 'N')
UPDATE `ium_menu` SET `is_folder` = 'N' WHERE `is_folder` IS NULL OR `is_folder` = '';

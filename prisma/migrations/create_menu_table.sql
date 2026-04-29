-- 메뉴 테이블 생성
CREATE TABLE IF NOT EXISTS `ium_menu` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `menu_id` VARCHAR(50) NOT NULL UNIQUE COMMENT '메뉴 식별자 (예: dashboard, sku-search-url)',
    `title` VARCHAR(100) NOT NULL COMMENT '메뉴 제목',
    `href` VARCHAR(255) NULL COMMENT '링크 경로 (폴더인 경우 NULL)',
    `icon` VARCHAR(50) NULL COMMENT '아이콘 이름 (lucide-react)',
    `parent_id` INT NULL COMMENT '부모 메뉴 ID (NULL이면 최상위)',
    `sort_order` INT NOT NULL DEFAULT 0 COMMENT '정렬 순서',
    `is_folder` CHAR(1) NOT NULL DEFAULT 'N' COMMENT '폴더 여부 (Y/N)',
    `is_active` CHAR(1) NOT NULL DEFAULT 'Y' COMMENT '활성화 여부 (Y/N)',
    `required_level` INT NOT NULL DEFAULT 0 COMMENT '필요한 권한 레벨 (mb_level)',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_parent_id` (`parent_id`),
    INDEX `idx_sort_order` (`sort_order`),
    INDEX `idx_is_active` (`is_active`),
    INDEX `idx_is_folder` (`is_folder`),
    FOREIGN KEY (`parent_id`) REFERENCES `ium_menu`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사이드바 메뉴 테이블';

-- 기본 메뉴 데이터 삽입
INSERT INTO `ium_menu` (`menu_id`, `title`, `href`, `icon`, `parent_id`, `sort_order`, `is_folder`, `is_active`, `required_level`) VALUES
('dashboard', '대시보드', '/', 'LayoutDashboard', NULL, 1, 'N', 'Y', 0),
('sales', '영업', NULL, 'Briefcase', NULL, 2, 'Y', 'Y', 0),
('sku-search-url', 'SKU 검색 URL', '/sku-search-url', 'FileText', NULL, 3, 'N', 'Y', 0),
('users', '사용자 관리', '/users', 'Users', NULL, 4, 'N', 'Y', 0),
('analytics', '분석', '/analytics', 'BarChart3', NULL, 5, 'N', 'Y', 0),
('settings', '설정', '/settings', 'Settings', NULL, 6, 'N', 'Y', 0)
ON DUPLICATE KEY UPDATE 
    `title` = VALUES(`title`),
    `href` = VALUES(`href`),
    `icon` = VALUES(`icon`),
    `sort_order` = VALUES(`sort_order`),
    `is_folder` = VALUES(`is_folder`),
    `is_active` = VALUES(`is_active`),
    `required_level` = VALUES(`required_level`);

-- 영업 폴더 하위 메뉴 예시 (실제 사용 시 수정 필요)
-- 영업 폴더 ID 가져오기
SET @sales_folder_id = (SELECT id FROM ium_menu WHERE menu_id = 'sales');

-- 영업 폴더 하위 메뉴 추가 예시
INSERT INTO `ium_menu` (`menu_id`, `title`, `href`, `icon`, `parent_id`, `sort_order`, `is_folder`, `is_active`, `required_level`) VALUES
('sales-order', '주문 관리', '/sales/order', 'ShoppingCart', @sales_folder_id, 1, 'N', 'Y', 0),
('sales-customer', '고객 관리', '/sales/customer', 'Users', @sales_folder_id, 2, 'N', 'Y', 0)
ON DUPLICATE KEY UPDATE 
    `title` = VALUES(`title`),
    `href` = VALUES(`href`),
    `icon` = VALUES(`icon`),
    `sort_order` = VALUES(`sort_order`),
    `is_folder` = VALUES(`is_folder`),
    `is_active` = VALUES(`is_active`),
    `required_level` = VALUES(`required_level`);

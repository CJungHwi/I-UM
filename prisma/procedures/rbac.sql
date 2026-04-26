-- =============================================================================
-- RBAC (역할·권한) — ium_users.role 로 역할 코드를 관리합니다.
-- 역할 코드: SYSTEM_ADMIN, ACADEMY_ADMIN, ACADEMY_MEMBER
-- 앱: sp_rbac_list_permissions_by_role(role_code) → JWT session.permissions
-- =============================================================================

USE ium;

-- ---------------------------------------------------------------------------
-- 테이블
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS rbac_role (
    role_code VARCHAR(40) NOT NULL PRIMARY KEY COMMENT 'SYSTEM_ADMIN 등',
    name VARCHAR(100) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rbac_permission (
    perm_code VARCHAR(100) NOT NULL PRIMARY KEY COMMENT 'dot 구분, 예: admin.users.manage',
    description VARCHAR(255) NULL,
    category VARCHAR(60) NULL COMMENT 'crm, lms, admin 등',
    sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rbac_role_permission (
    role_code VARCHAR(40) NOT NULL,
    perm_code VARCHAR(100) NOT NULL,
    PRIMARY KEY (role_code, perm_code),
    CONSTRAINT fk_rrp_role FOREIGN KEY (role_code) REFERENCES rbac_role (role_code) ON DELETE CASCADE,
    CONSTRAINT fk_rrp_perm FOREIGN KEY (perm_code) REFERENCES rbac_permission (perm_code) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 역할 (ium_users.role 과 1:1 대응)
-- ---------------------------------------------------------------------------

INSERT INTO rbac_role (role_code, name, sort_order) VALUES
    ('SYSTEM_ADMIN', '시스템 전체 관리자', 10),
    ('ACADEMY_ADMIN', '학원 관리자', 9),
    ('ACADEMY_MEMBER', '학원 강사/일반', 2)
ON DUPLICATE KEY UPDATE name = VALUES(name), sort_order = VALUES(sort_order);

-- ---------------------------------------------------------------------------
-- 권한 시드 (필요 시 perm_code 추가 후 rbac_role_permission 에만 반영)
-- ---------------------------------------------------------------------------

INSERT INTO rbac_permission (perm_code, description, category, sort_order) VALUES
    ('dashboard.view', '대시보드 조회', 'core', 1),
    ('crm.access', 'CRM 메뉴·기본 접근', 'crm', 10),
    ('crm.prospects.manage', '상담·리드 관리', 'crm', 11),
    ('crm.students.manage', '학생 정보 관리', 'crm', 12),
    ('lms.access', 'LMS 메뉴·기본 접근', 'lms', 20),
    ('lms.classes.manage', '수업·반 관리', 'lms', 21),
    ('erp.access', 'ERP 메뉴·기본 접근', 'erp', 30),
    ('hrm.access', 'HRM 메뉴·기본 접근', 'hrm', 40),
    ('thread.read', '이음 스레드 조회', 'crm', 50),
    ('thread.write', '이음 스레드 작성·댓글', 'crm', 51),
    ('thread.moderate', '스레드 삭제·고정', 'crm', 52),
    ('gami.view', '게이미 대시보드 조회', 'gami', 60),
    ('gami.adjust', '포인트·배지 수동 조정', 'gami', 61),
    ('admin.users.manage', '회원 승인·역할 변경', 'admin', 100),
    ('admin.register.view', '회원가입 페이지(관리)', 'admin', 101),
    ('admin.settings', '시스템·메뉴 설정', 'admin', 102),
    ('admin.academies.manage', '학원 마스터 관리', 'admin', 103)
ON DUPLICATE KEY UPDATE
    description = VALUES(description),
    category = VALUES(category),
    sort_order = VALUES(sort_order);

-- ---------------------------------------------------------------------------
-- 역할별 권한
-- ---------------------------------------------------------------------------

DELETE FROM rbac_role_permission WHERE role_code IN (
    'DIRECTOR_ADMIN',
    'DIRECTOR_USER',
    'TEACHER_ADMIN',
    'TEACHER_USER',
    'SYSTEM_ADMIN',
    'ACADEMY_ADMIN',
    'ACADEMY_MEMBER'
);

INSERT INTO rbac_role_permission (role_code, perm_code)
SELECT 'SYSTEM_ADMIN', perm_code FROM rbac_permission;

INSERT INTO rbac_role_permission (role_code, perm_code) VALUES
    ('ACADEMY_ADMIN', 'dashboard.view'),
    ('ACADEMY_ADMIN', 'crm.access'),
    ('ACADEMY_ADMIN', 'crm.prospects.manage'),
    ('ACADEMY_ADMIN', 'crm.students.manage'),
    ('ACADEMY_ADMIN', 'lms.access'),
    ('ACADEMY_ADMIN', 'lms.classes.manage'),
    ('ACADEMY_ADMIN', 'erp.access'),
    ('ACADEMY_ADMIN', 'hrm.access'),
    ('ACADEMY_ADMIN', 'thread.read'),
    ('ACADEMY_ADMIN', 'thread.write'),
    ('ACADEMY_ADMIN', 'thread.moderate'),
    ('ACADEMY_ADMIN', 'gami.view'),
    ('ACADEMY_ADMIN', 'gami.adjust'),
    ('ACADEMY_ADMIN', 'admin.users.manage');

INSERT INTO rbac_role_permission (role_code, perm_code) VALUES
    ('ACADEMY_MEMBER', 'dashboard.view'),
    ('ACADEMY_MEMBER', 'crm.access'),
    ('ACADEMY_MEMBER', 'crm.students.manage'),
    ('ACADEMY_MEMBER', 'lms.access'),
    ('ACADEMY_MEMBER', 'thread.read'),
    ('ACADEMY_MEMBER', 'thread.write'),
    ('ACADEMY_MEMBER', 'gami.view');

-- ---------------------------------------------------------------------------
-- 프로시저: 역할 코드로 권한 목록 (세션 JWT 채움용)
-- ---------------------------------------------------------------------------

DROP PROCEDURE IF EXISTS sp_rbac_list_permissions_by_role;

DELIMITER //

CREATE PROCEDURE sp_rbac_list_permissions_by_role(IN p_role_code VARCHAR(40))
BEGIN
    SELECT p.perm_code AS perm_code
    FROM rbac_role_permission rp
    INNER JOIN rbac_permission p ON p.perm_code = rp.perm_code
    WHERE rp.role_code = p_role_code
    ORDER BY p.category, p.sort_order, p.perm_code;
END //

DELIMITER ;

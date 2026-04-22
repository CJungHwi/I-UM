-- =============================================================================
-- RBAC (역할·권한) — ium_users.user_level + user_grade 로 역할 코드를 만들고
-- rbac_role_permission 으로 버튼·API 단위 권한을 매핑합니다.
-- 역할 코드 예: DIRECTOR_ADMIN, DIRECTOR_USER, TEACHER_ADMIN, TEACHER_USER
-- 앱: sp_rbac_list_permissions_by_role(role_code) → JWT session.permissions
-- =============================================================================

USE ium;

-- ---------------------------------------------------------------------------
-- 테이블
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS rbac_role (
    role_code VARCHAR(40) NOT NULL PRIMARY KEY COMMENT 'DIRECTOR_ADMIN 등',
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
-- 역할 (ium_users 조합과 1:1 대응)
-- ---------------------------------------------------------------------------

INSERT INTO rbac_role (role_code, name, sort_order) VALUES
    ('DIRECTOR_ADMIN', '원장·관리자', 10),
    ('DIRECTOR_USER', '원장·일반', 9),
    ('TEACHER_ADMIN', '교사·관리자', 8),
    ('TEACHER_USER', '교사·일반', 2)
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
    ('admin.settings', '시스템·메뉴 설정', 'admin', 102)
ON DUPLICATE KEY UPDATE
    description = VALUES(description),
    category = VALUES(category),
    sort_order = VALUES(sort_order);

-- ---------------------------------------------------------------------------
-- 역할별 권한 (원장·관리자: 전체, 교사·일반: 운영 위주)
-- ---------------------------------------------------------------------------

DELETE FROM rbac_role_permission WHERE role_code IN (
    'DIRECTOR_ADMIN', 'DIRECTOR_USER', 'TEACHER_ADMIN', 'TEACHER_USER'
);

INSERT INTO rbac_role_permission (role_code, perm_code)
SELECT 'DIRECTOR_ADMIN', perm_code FROM rbac_permission;

INSERT INTO rbac_role_permission (role_code, perm_code) VALUES
    ('DIRECTOR_USER', 'dashboard.view'),
    ('DIRECTOR_USER', 'crm.access'),
    ('DIRECTOR_USER', 'crm.prospects.manage'),
    ('DIRECTOR_USER', 'crm.students.manage'),
    ('DIRECTOR_USER', 'lms.access'),
    ('DIRECTOR_USER', 'lms.classes.manage'),
    ('DIRECTOR_USER', 'erp.access'),
    ('DIRECTOR_USER', 'hrm.access'),
    ('DIRECTOR_USER', 'thread.read'),
    ('DIRECTOR_USER', 'thread.write'),
    ('DIRECTOR_USER', 'thread.moderate'),
    ('DIRECTOR_USER', 'gami.view');

INSERT INTO rbac_role_permission (role_code, perm_code) VALUES
    ('TEACHER_ADMIN', 'dashboard.view'),
    ('TEACHER_ADMIN', 'crm.access'),
    ('TEACHER_ADMIN', 'crm.prospects.manage'),
    ('TEACHER_ADMIN', 'crm.students.manage'),
    ('TEACHER_ADMIN', 'lms.access'),
    ('TEACHER_ADMIN', 'lms.classes.manage'),
    ('TEACHER_ADMIN', 'erp.access'),
    ('TEACHER_ADMIN', 'hrm.access'),
    ('TEACHER_ADMIN', 'thread.read'),
    ('TEACHER_ADMIN', 'thread.write'),
    ('TEACHER_ADMIN', 'thread.moderate'),
    ('TEACHER_ADMIN', 'gami.view'),
    ('TEACHER_ADMIN', 'gami.adjust'),
    ('TEACHER_ADMIN', 'admin.users.manage');

INSERT INTO rbac_role_permission (role_code, perm_code) VALUES
    ('TEACHER_USER', 'dashboard.view'),
    ('TEACHER_USER', 'crm.access'),
    ('TEACHER_USER', 'crm.students.manage'),
    ('TEACHER_USER', 'lms.access'),
    ('TEACHER_USER', 'thread.read'),
    ('TEACHER_USER', 'thread.write'),
    ('TEACHER_USER', 'gami.view');

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

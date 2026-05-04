-- 공통 코드 테이블 + 재원생 접수경로
-- 적용 후 prisma/procedures/ium_code.sql, ium_students.sql, ium_consultation.sql 을 DB에 재실행하세요.

CREATE TABLE IF NOT EXISTS ium_code (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code_type VARCHAR(40) NOT NULL COMMENT 'STUDENT_GRADE, ADMISSION_ROUTE, CONSULT_STATUS 등',
    code VARCHAR(40) NOT NULL,
    label VARCHAR(100) NOT NULL COMMENT '화면 표시명',
    sort_no INT NOT NULL DEFAULT 0,
    next_grade_code VARCHAR(40) NULL COMMENT '학년도 이월 시 승급 대상 코드',
    del_yn CHAR(1) NOT NULL DEFAULT 'N',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_ium_code_type_code (code_type, code),
    KEY idx_ium_code_type (code_type, del_yn, sort_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='이음 공통 코드';

-- 이미 컬럼이 있으면 이 줄은 건너뛰세요.
ALTER TABLE ium_students
    ADD COLUMN admission_route_code VARCHAR(40) NULL COMMENT '접수경로(ium_code ADMISSION_ROUTE)' AFTER grade;

-- 학년 코드 (next_grade_code: 새 학년도 승급 시 사용 예정)
INSERT INTO ium_code (code_type, code, label, sort_no, next_grade_code) VALUES
    ('STUDENT_GRADE', 'UNDEF', '미정', 5, NULL),
    ('STUDENT_GRADE', 'PRE', '예비초', 10, 'ES1'),
    ('STUDENT_GRADE', 'ES1', '초1', 20, 'ES2'),
    ('STUDENT_GRADE', 'ES2', '초2', 21, 'ES3'),
    ('STUDENT_GRADE', 'ES3', '초3', 22, 'ES4'),
    ('STUDENT_GRADE', 'ES4', '초4', 23, 'ES5'),
    ('STUDENT_GRADE', 'ES5', '초5', 24, 'ES6'),
    ('STUDENT_GRADE', 'ES6', '초6', 25, 'MS1'),
    ('STUDENT_GRADE', 'MS1', '중1', 30, 'MS2'),
    ('STUDENT_GRADE', 'MS2', '중2', 31, 'MS3'),
    ('STUDENT_GRADE', 'MS3', '중3', 32, 'HS1'),
    ('STUDENT_GRADE', 'HS1', '고1', 40, 'HS2'),
    ('STUDENT_GRADE', 'HS2', '고2', 41, 'HS3'),
    ('STUDENT_GRADE', 'HS3', '고3', 42, NULL)
ON DUPLICATE KEY UPDATE
    label = VALUES(label),
    sort_no = VALUES(sort_no),
    next_grade_code = VALUES(next_grade_code);

-- 접수경로 코드
INSERT INTO ium_code (code_type, code, label, sort_no, next_grade_code) VALUES
    ('ADMISSION_ROUTE', 'WALK_IN', '내방', 1, NULL),
    ('ADMISSION_ROUTE', 'PHONE', '전화', 2, NULL),
    ('ADMISSION_ROUTE', 'KAKAO', '카카오·문자', 3, NULL),
    ('ADMISSION_ROUTE', 'ONLINE', '홈페이지·SNS', 4, NULL),
    ('ADMISSION_ROUTE', 'REFER', '지인소개', 5, NULL),
    ('ADMISSION_ROUTE', 'TRANSFER', '타기관 이동', 6, NULL),
    ('ADMISSION_ROUTE', 'EVENT', '설명회·행사', 7, NULL),
    ('ADMISSION_ROUTE', 'OTHER', '기타', 99, NULL)
ON DUPLICATE KEY UPDATE
    label = VALUES(label),
    sort_no = VALUES(sort_no),
    next_grade_code = VALUES(next_grade_code);

-- 상담 상태 코드 (`ium_consultation.status` 저장값과 동일)
INSERT INTO ium_code (code_type, code, label, sort_no, next_grade_code) VALUES
    ('CONSULT_STATUS', 'NEW', '신규', 10, NULL),
    ('CONSULT_STATUS', 'IN_PROGRESS', '진행중', 20, NULL),
    ('CONSULT_STATUS', 'WAIT', '보류', 30, NULL),
    ('CONSULT_STATUS', 'CONVERTED', '등록완료', 40, NULL),
    ('CONSULT_STATUS', 'LOST', '이탈', 50, NULL)
ON DUPLICATE KEY UPDATE
    label = VALUES(label),
    sort_no = VALUES(sort_no),
    next_grade_code = VALUES(next_grade_code);

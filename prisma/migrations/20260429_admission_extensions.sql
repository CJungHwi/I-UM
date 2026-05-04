-- 입학·원생 확장 (기존 DB 일회 적용)
-- 이미 컬럼이 있으면 해당 구문은 건너뛰고, 이어서 prisma/procedures 의
-- ium_students.sql, ium_consultation.sql, ium_student_timeline.sql 을 DB에 재실행하세요.

ALTER TABLE ium_students
    ADD COLUMN photo_url VARCHAR(500) NULL COMMENT '학생 사진 URL' AFTER memo,
    ADD COLUMN interest_tags VARCHAR(2000) NULL COMMENT '관심 키워드(콤마 구분)' AFTER photo_url;

ALTER TABLE ium_consultation
    ADD COLUMN channel_detail VARCHAR(120) NULL COMMENT '유입 경로 상세(당근·인스타 등)' AFTER memo,
    ADD COLUMN consult_school VARCHAR(100) NULL COMMENT '상담 시 학교' AFTER channel_detail,
    ADD COLUMN prior_academy_note TEXT NULL COMMENT '기존 학원 수강 이력' AFTER consult_school,
    ADD COLUMN withdraw_reason VARCHAR(200) NULL COMMENT '퇴원 사유' AFTER prior_academy_note,
    ADD COLUMN subject_interest_note VARCHAR(600) NULL COMMENT '과목별 흥미도' AFTER withdraw_reason,
    ADD COLUMN parent_education_view VARCHAR(600) NULL COMMENT '학부모 교육관' AFTER subject_interest_note,
    ADD COLUMN child_personality_note VARCHAR(600) NULL COMMENT '아이 성격 메모' AFTER parent_education_view,
    ADD COLUMN special_requests TEXT NULL COMMENT '특이 요청사항' AFTER child_personality_note,
    ADD COLUMN not_registered_reason VARCHAR(200) NULL COMMENT '미등록 사유' AFTER special_requests,
    ADD COLUMN next_contact_at DATETIME NULL COMMENT '다음 연락 예정' AFTER not_registered_reason;

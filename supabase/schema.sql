-- Nagrik Mitra schema (idempotent). Run in Supabase SQL editor.
-- NOTE: ward coordinates are APPROXIMATE centroids for demo matching (Pune municipal area).
-- If citizen location is farther than 25 km from all ward centroids, ward_id is stored as null.

create extension if not exists "pgcrypto";

do $$ begin
  create type complaint_status as enum ('submitted','in_review','in_progress','resolved','rejected');
exception when duplicate_object then null; end $$;

create table if not exists departments (
  key text primary key,
  name_en text not null,
  name_mr text not null,
  name_hi text not null,
  category text not null,
  docs jsonb not null default '[]'::jsonb
);

create table if not exists wards (
  id serial primary key,
  name text not null unique,
  lat double precision not null,
  lng double precision not null
);

create table if not exists complaints (
  id uuid primary key default gen_random_uuid(),
  ref_no text unique not null,
  category text not null check (category in ('pothole','garbage','ration_card','other')),
  department_key text references departments(key),
  lang text not null check (lang in ('mr','hi','en')),
  transcript text not null,
  summary_en text,
  summary_local text,
  severity text check (severity in ('low','medium','high')),
  lat double precision not null,
  lng double precision not null,
  address text,
  ward_id int references wards(id),
  image_url text,
  pdf_url text,
  citizen_name text,
  citizen_phone text,
  status complaint_status not null default 'submitted',
  created_at timestamptz not null default now()
);

create table if not exists status_events (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references complaints(id) on delete cascade,
  status complaint_status not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_complaints_ward on complaints(ward_id);
create index if not exists idx_complaints_category on complaints(category);
create index if not exists idx_complaints_status on complaints(status);
create index if not exists idx_complaints_created on complaints(created_at desc);

-- Public view: NO personal data (NO citizen_name, citizen_phone, or pdf_url)
-- pdf_url is omitted because complaint-pdfs bucket is private to protect citizen PII.
-- PDF downloads require a short-lived signed URL generated via the backend.
drop view if exists public_complaints;
create view public_complaints as
select c.id, c.ref_no, c.category, c.department_key, c.lang, c.summary_en, c.summary_local,
       c.severity, c.lat, c.lng, c.address, c.ward_id, w.name as ward_name,
       c.image_url, c.status, c.created_at
from complaints c left join wards w on w.id = c.ward_id;

-- RLS: lock tables, expose view only
alter table departments enable row level security;
alter table wards enable row level security;
alter table complaints enable row level security;
alter table status_events enable row level security;

-- Default-deny & revoke raw PII tables from anon / public
revoke all on complaints from anon, authenticated, public;
revoke all on status_events from anon, authenticated, public;

do $$ begin
  create policy "public read departments" on departments for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public read wards" on wards for select using (true);
exception when duplicate_object then null; end $$;

grant select on departments to anon, authenticated;
grant select on wards to anon, authenticated;

-- View runs with owner rights so anon can read it without table access
alter view public_complaints set (security_invoker = false);
grant select on public_complaints to anon, authenticated;

-- Seed departments with i18n document checklists (Single source of truth)
insert into departments (key, name_en, name_mr, name_hi, category, docs) values
(
  'pmc_road',
  'PMC Road Department / Ward Office',
  'पुणे महानगरपालिका पथ विभाग / क्षेत्रीय कार्यालय',
  'पुणे महानगरपालिका पथ विभाग / वार्ड कार्यालय',
  'pothole',
  '[
    {"en": "Photo of the pothole", "mr": "खड्ड्याचे छायाचित्र (फोटो)", "hi": "सड़क के गड्ढे की तस्वीर (फोटो)"},
    {"en": "Exact location / nearby landmark", "mr": "अचूक ठिकाण / जवळची खूण (लँडमार्क)", "hi": "सटीक स्थान / नजदीकी लैंडमार्क"},
    {"en": "Citizen name and contact number", "mr": "नागरिकाचे नाव व संपर्क क्रमांक", "hi": "नागरिक का नाम व संपर्क नंबर"}
  ]'::jsonb
),
(
  'pmc_swm',
  'PMC Solid Waste Management Department',
  'पुणे महानगरपालिका घनकचरा व्यवस्थापन विभाग',
  'पुणे महानगरपालिका ठोस अपशिष्ट प्रबंधन विभाग',
  'garbage',
  '[
    {"en": "Photo of the garbage dump", "mr": "कचऱ्याच्या ढिगाऱ्याचे छायाचित्र (फोटो)", "hi": "कचरे के ढेर की तस्वीर (फोटो)"},
    {"en": "Exact location / nearby landmark", "mr": "अचूक ठिकाण / जवळची खूण (लँडमार्क)", "hi": "सटीक स्थान / नजदीकी लैंडमार्क"},
    {"en": "Citizen name and contact number", "mr": "नागरिकाचे नाव व संपर्क क्रमांक", "hi": "नागरिक का नाम व संपर्क नंबर"}
  ]'::jsonb
),
(
  'food_civil_supplies',
  'Food & Civil Supplies Office (Ration)',
  'अन्न व नागरी पुरवठा कार्यालय',
  'खाद्य एवं नागरिक आपूर्ति कार्यालय',
  'ration_card',
  '[
    {"en": "Copy of existing ration card", "mr": "विद्यमान रेशन कार्डची प्रत", "hi": "मौजूदा राशन कार्ड की प्रति"},
    {"en": "Aadhaar card of applicant", "mr": "अर्जदाराचे आधार कार्ड", "hi": "आवेदक का आधार कार्ड"},
    {"en": "Proof of correct details (Aadhaar / birth certificate / marriage certificate)", "mr": "दुरुस्तीचा पुरावा (आधार / जन्म दाखला / विवाह नोंदणी दाखला)", "hi": "दुरुस्ती का प्रमाण (आधार / जन्म प्रमाण पत्र / विवाह प्रमाण पत्र)"},
    {"en": "Address proof (Electricity bill / Property tax receipt)", "mr": "पत्त्याचा पुरावा (वीज बिल / घरपट्टी पावती)", "hi": "पते का प्रमाण (बिजली बिल / संपत्तिकर रसीद)"},
    {"en": "Passport size photograph", "mr": "पासपोर्ट आकाराचे छायाचित्र", "hi": "पासपोर्ट साइज फोटो"}
  ]'::jsonb
)
on conflict (key) do update set
  name_en = excluded.name_en,
  name_mr = excluded.name_mr,
  name_hi = excluded.name_hi,
  category = excluded.category,
  docs = excluded.docs;

-- Seed wards (APPROXIMATE centroids for demo matching in Pune)
insert into wards (name, lat, lng) values
('Shivajinagar-Ghole Road', 18.5308, 73.8475),
('Kasba-Vishrambaug', 18.5196, 73.8553),
('Aundh-Baner', 18.5590, 73.7868),
('Kothrud-Bavdhan', 18.5074, 73.8077),
('Hadapsar-Mundhwa', 18.5089, 73.9259),
('Yerawada-Kalas-Dhanori', 18.5679, 73.9143),
('Bibwewadi', 18.4800, 73.8620),
('Sinhagad Road', 18.4800, 73.8200),
('Warje-Karvenagar', 18.4900, 73.8000),
('Nagar Road-Wadgaonsheri', 18.5500, 73.9000)
on conflict (name) do nothing;

-- Storage buckets configuration in Supabase dashboard:
-- 1. complaint-images: PUBLIC bucket (allows public read access for issue photos)
-- 2. complaint-pdfs: PRIVATE bucket (strictly private; contains citizen PII; access via signed URL only)

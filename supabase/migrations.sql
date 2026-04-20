-- Run this in Supabase SQL Editor to add country/phone columns to patients
alter table patients add column if not exists country text;
alter table patients add column if not exists phone text;

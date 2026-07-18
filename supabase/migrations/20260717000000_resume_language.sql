-- The resume language is presentation metadata. It is separate from the
-- trusted profile JSON so changing a language never changes factual CV data.

alter table public.resume_profiles
  add column if not exists resume_language text not null default 'en'
    check (resume_language in ('en', 'fr')),
  add column if not exists resume_language_source text not null default 'detected'
    check (resume_language_source in ('detected', 'user_selected'));

alter table public.resume_drafts
  add column if not exists resume_language text not null default 'en'
    check (resume_language in ('en', 'fr'));

-- Add strategic fields to assets
alter table assets add column performance_score int check (performance_score between 0 and 100);
alter table assets add column brand_fit_score int check (brand_fit_score between 0 and 100);
alter table assets add column strategic_rationale text;
alter table assets add column regeneration_options jsonb; -- Store modifiers used or available

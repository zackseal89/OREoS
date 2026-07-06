-- Add strategy column to campaigns
alter table campaigns add column strategy jsonb;

-- Extend campaign_ideas with more strategic fields
alter table campaign_ideas add column creative_direction text;
alter table campaign_ideas add column content_pillar text;
alter table campaign_ideas rename column rationale to strategic_rationale;
alter table campaign_ideas alter column strategic_rationale type text;

-- Migration: Add Hardcore Accountability Mode, North Star Motivation, Next Day Plan Time, and 3-Reset Limit

ALTER TABLE public.reminder_settings
ADD COLUMN IF NOT EXISTS accountability_tone TEXT NOT NULL DEFAULT 'hardcore' CHECK (accountability_tone IN ('hardcore', 'coach', 'roast')),
ADD COLUMN IF NOT EXISTS why_i_must_switch TEXT NOT NULL DEFAULT 'To escape career stagnation, command top-tier compensation (35L+), and master engineering at scale.',
ADD COLUMN IF NOT EXISTS next_day_plan_time TIME NOT NULL DEFAULT '21:30',
ADD COLUMN IF NOT EXISTS start_date_resets_remaining INT NOT NULL DEFAULT 3;

-- Update existing rows if any
UPDATE public.reminder_settings
SET 
  accountability_tone = COALESCE(accountability_tone, 'hardcore'),
  why_i_must_switch = COALESCE(why_i_must_switch, 'To escape career stagnation, command top-tier compensation (35L+), and master engineering at scale.'),
  next_day_plan_time = COALESCE(next_day_plan_time, '21:30'::time),
  start_date_resets_remaining = COALESCE(start_date_resets_remaining, 3)
WHERE accountability_tone IS NULL OR why_i_must_switch IS NULL OR next_day_plan_time IS NULL;

-- ═══════════════════════════════════════════════════════════════
--  THE ANVIL — Full Activity Library Seed (Complete Replacement)
--  Run this in Supabase → SQL Editor
--  WARNING: Deletes all existing activity_library rows first
-- ═══════════════════════════════════════════════════════════════

DELETE FROM activity_library;

-- ─────────────────────────────────────────────────────────────
-- 🏋️  PHYSICAL  — 5-minute workouts, increasing intensity
-- ─────────────────────────────────────────────────────────────
INSERT INTO activity_library (category, activity_name, tier_1_value, tier_2_value, tier_3_value, tier_4_value) VALUES

('physical', 'Push Circuit',
  '5-min workout — 2×8 push-ups, 2×10 squats, 30s plank. Rest as needed between sets.',
  '5-min workout — 3×15 push-ups, 3×15 squats, 45s plank. 20s rest between sets.',
  '5-min workout — 4×20 push-ups, 4×20 squats, 60s plank. 15s rest between sets.',
  '5-min AMRAP — 15 push-ups → 20 squats → 30s plank. Max rounds. No stopping.'
),

('physical', 'Core Blitz',
  '5-min workout — 2×10 crunches, 2×10 leg raises, 20s plank. Rest freely.',
  '5-min workout — 3×20 crunches, 3×15 leg raises, 2×40s plank. 15s rest.',
  '5-min workout — 4×20 bicycle crunches, 4×15 leg raises, 2×60s plank. 10s rest.',
  '5-min AMRAP — 20 V-ups → 20 leg raises → 60s plank. Max rounds, no rest.'
),

('physical', 'Lower Body Blast',
  '5-min workout — 2×10 squats, 2×8 reverse lunges each leg, 15s wall sit. Rest freely.',
  '5-min workout — 3×20 squats, 3×12 lunges each leg, 30s wall sit. 15s rest.',
  '5-min workout — 4×20 jump squats, 4×15 lunges each leg, 45s wall sit. 10s rest.',
  '5-min AMRAP — 20 jump squats → 12 Bulgarian split squats per leg → 60s wall sit. Max rounds.'
),

('physical', 'Full Body HIIT',
  '5-min — 30s jumping jacks, 30s squats, 30s push-ups, 30s rest. Repeat ×2.',
  '5-min — 40s burpees, 20s rest, 40s mountain climbers, 20s rest. Repeat ×3.',
  '5-min — 45s burpees, 45s push-ups, 45s jump squats, 15s rest between each. Repeat ×2.',
  '5-min AMRAP — 10 burpees → 15 push-ups → 20 jump squats. Max rounds. No mercy.'
),

('physical', 'Upper Body Pump',
  '5-min workout — 2×10 push-ups, 2×15 tricep dips (chair), 2×10 shoulder taps. Rest freely.',
  '5-min workout — 3×15 wide push-ups, 3×20 tricep dips, 3×15 shoulder taps. 15s rest.',
  '5-min workout — 4×20 diamond push-ups, 4×20 tricep dips, 3×20s pike hold. 10s rest.',
  '5-min AMRAP — 20 diamond push-ups → 25 tricep dips → 30s pike push-up hold. Max rounds.'
),

('physical', 'Cardio Burst',
  '5-min — 6×30s jog in place at steady pace, 10s rest between. Controlled breathing.',
  '5-min — 6×30s high knees, 5×20s mountain climbers. 15s rest between each.',
  '5-min — 8×30s all-out sprint on spot, 7s rest. Maintain form throughout.',
  '5-min all-out — 10×30s max-effort sprint on spot, 0s rest. Do not slow down.'
),

('physical', 'Mobility & Strength',
  '5-min — 60s deep squat hold, 30s hip flexor stretch each side, 30s cat-cow. ×2.',
  '5-min — 10 deep squat to stand, 10 inchworms, 30s pigeon pose each side.',
  '5-min — 10 Hindu push-ups, 10 world greatest stretch each side, 60s deep squat hold.',
  '5-min flow ×2 — 5 burpees → 10 Hindu push-ups → 10 world greatest stretch → 60s deep squat.'
),

('physical', 'Sprint Finisher',
  '5-min — 6×30s run on spot at 70% effort, 20s rest. Find a pace you can hold.',
  '5-min — 6×35s all-out sprint on spot, 15s rest. Push every interval.',
  '5-min — 8×30s max effort sprint on spot, 8s rest. Lungs should be burning.',
  '5-min — 10×27s absolute max effort, 3s rest. Fastest you have ever moved. Nothing held back.'
),

-- ─────────────────────────────────────────────────────────────
-- 🧠  MENTAL
-- ─────────────────────────────────────────────────────────────

('mental', 'Deep Reading',
  'Read for 10 minutes on any non-fiction topic. Full comprehension — no skimming.',
  'Read for 20 minutes. Write 1 sentence capturing the single most useful idea.',
  'Read for 30 minutes. Write 3 key takeaways and 1 specific way to apply them.',
  'Read for 45 minutes. Summarise the chapter in your own words and connect it to your life.'
),

('mental', 'Daily Journaling',
  'Write 3 sentences: what happened today, how you felt, what you will do differently tomorrow.',
  'Write 1 full page: what is on your mind, what is challenging you, what you are learning.',
  'Write 2 pages: deep reflection on a current problem — root causes, patterns, possible solutions.',
  'Write a detailed plan for a goal you have been avoiding. Break it into 7 specific daily actions.'
),

('mental', 'Learn Something New',
  'Watch a 10-minute educational video on a topic you know nothing about. Write 1 thing you learned.',
  'Spend 20 minutes studying a new skill — coding, language, history, finance. Take notes.',
  'Spend 30 minutes learning with active notes. Then close everything and teach it back to yourself out loud.',
  'Spend 45 minutes in deep study. Write a 1-page summary as if explaining it to someone who knows nothing.'
),

('mental', 'Brain Training',
  'Complete 1 puzzle — sudoku, chess puzzle, or logic riddle.',
  'Complete 3 puzzles or 15 minutes of a brain-training app at medium difficulty.',
  '20 minutes of chess or 5 hard logic puzzles. Seek the hardest challenge you can find.',
  '30 minutes of deliberate mental challenge: speed chess, advanced logic problems, or a real coding problem.'
),

('mental', 'Goal Review',
  'Write your top 3 goals. Spend 5 minutes thinking about exactly why each one matters.',
  'Review your goals and rate your progress 1–10 on each. Write specifically what is blocking you.',
  'Full goal audit: rewrite each goal clearly, list 3 next actions for each, cut anything no longer aligned.',
  'Strategic planning session: map your 90-day plan with weekly milestones written clearly.'
),

('mental', 'Vocabulary Builder',
  'Learn 3 new words. Write each one in a sentence that shows you understand it.',
  'Learn 5 new words and use 2 of them naturally in conversation or writing today.',
  'Learn 8 new words, understand the root of each, and write a paragraph using 4 of them.',
  'Learn 10 new words. Write a full paragraph using all 10 correctly. No looking back after you start.'
),

('mental', 'Problem Solving',
  'Write down 1 problem you are facing. List 5 possible solutions without judging any of them.',
  'Pick a real problem in your life. Write the cause, the impact, and 3 possible solutions.',
  'Apply first-principles thinking to a problem: break it down to its basics and rebuild the solution.',
  'Write a full problem-solution document: define the problem clearly, list 5 options with pros/cons, commit to 1.'
),

('mental', 'Mindful Listening',
  'Listen to a 10-minute podcast on a topic outside your usual interests. What did you learn?',
  'Listen to a 20-minute episode. Write 3 ideas worth keeping.',
  'Listen to a 30-minute episode on something that challenges your current thinking. Take notes.',
  'Listen to a full episode (45+ mins) presenting a view you disagree with. Write what genuinely made you think.'
),

-- ─────────────────────────────────────────────────────────────
-- 🗣️  CONFIDENCE  — stranger interactions & social boldness
-- ─────────────────────────────────────────────────────────────

('confidence', 'Compliment a Stranger',
  'Give 1 genuine compliment to a stranger today. Make it specific. Look them in the eye when you say it.',
  'Give 3 genuine compliments to strangers today. Notice how they respond.',
  'Give 5 compliments to strangers today. At least 2 should be to someone you find attractive.',
  'Give 10 genuine, specific compliments to different strangers throughout your day. Make each one land.'
),

('confidence', 'Start a Conversation',
  'Say hello and ask 1 genuine question to a stranger today — shop, gym, street, anywhere.',
  'Start conversations with 3 strangers. Keep each one going for at least 60 seconds.',
  'Have real back-and-forth conversations with 5 strangers today. Get at least 2 of their names.',
  'Start 10 conversations with strangers today. Make every single person feel genuinely seen.'
),

('confidence', 'Cold Shower',
  '30-second cold shower at the end of your normal shower. Do not hesitate — get straight in.',
  '60-second cold shower. Control your breathing. Do not cut it short no matter what.',
  '2-minute full cold shower from the very start. No warm water. Your mind will object. Ignore it.',
  '3-minute all-cold shower. Stay completely calm. Slow your breathing. Own the discomfort.'
),

('confidence', 'Approach Someone You Find Attractive',
  'Make deliberate eye contact and hold a genuine smile at someone you find attractive. Do not look away first.',
  'Walk up and give a sincere compliment to someone you find attractive. Keep it simple and direct.',
  'Approach someone you find attractive, introduce yourself, and hold a real conversation for 2+ minutes.',
  'Approach 3 people you find attractive today. Get at least 1 contact. No hesitation, no excuses.'
),

('confidence', 'Tell Someone They Look Good',
  'Tell 1 person today — stranger or not — something specific you genuinely noticed about them.',
  'Tell 3 different strangers something real: they look great, their energy is good, something specific you noticed.',
  'Tell 5 strangers something you genuinely thought but would normally keep to yourself. Say it anyway.',
  'Make 10 people feel good about themselves today. Strangers only. Watch what happens to your own energy.'
),

('confidence', 'Eye Contact Challenge',
  'Hold eye contact for the full length of 3 conversations today. Do not look away first.',
  'Hold warm, deliberate eye contact with every stranger you pass or speak to today.',
  'Lock eyes with 10 strangers as you walk past. Hold it until they look away. Smile if they do.',
  'Go through your entire day with full presence — eye contact, posture, calm. Every room, every person.'
),

('confidence', 'Rejection Challenge',
  'Ask a stranger for something small today — a recommendation, their opinion. Accept any answer.',
  'Ask 3 strangers for something that might get a no. Handle each outcome without flinching.',
  'Get rejected by a stranger on purpose. Ask for something bold. Walk away unbothered.',
  'Get rejected by 5 strangers in one day. Each no is proof you are doing what other men will not.'
),

('confidence', 'Hold Court',
  'Tell a story or share your opinion with 1 person and hold their attention all the way through.',
  'Tell a story or take a strong position in a group of 3 or more. Keep their attention without trailing off.',
  'Start and lead a conversation in a group setting. Make people lean in. Do not let it die.',
  'Walk into a social situation knowing no one. Leave knowing at least 5 people by name. You ran the room.'
),

-- ─────────────────────────────────────────────────────────────
-- 🧘  SPIRITUAL
-- ─────────────────────────────────────────────────────────────

('spiritual', 'Meditation',
  '5-minute silent or guided meditation. Sit still. Focus only on your breath.',
  '10-minute meditation. When your mind wanders, bring it back — no judgment.',
  '15-minute meditation. No guided audio. Sit with yourself in silence.',
  '20-minute deep meditation. One focus only: your breath, a single word, or pure stillness.'
),

('spiritual', 'Gratitude Practice',
  'Write 3 specific things you are grateful for. Be precise — not just "my family."',
  'Write 5 specific gratitudes. For each, write one sentence on why it matters to you.',
  'Write 5 gratitudes. Pick 1 and reflect on it deeply: why you have it, what life would look like without it.',
  'Write 10 gratitudes. Include things you take for granted every day. Sit with each one and actually feel it.'
),

('spiritual', 'Breathwork',
  '5 minutes of box breathing — 4s inhale, 4s hold, 4s exhale, 4s hold. Repeat.',
  '10 minutes of box breathing or 4-7-8 breathing. Extend the exhale each round.',
  '15 minutes of deliberate breathwork — Wim Hof cycles or extended box breathing.',
  '20-minute breathwork session. Full commitment. You should notice a clear shift in how you feel.'
),

('spiritual', 'Acts of Service',
  'Do 1 thing for someone today with no expectation of thanks or reward.',
  'Do 2 acts of service today. No announcement. No credit. Just give.',
  'Go out of your way to do something meaningful for someone who needs it. Make it count.',
  'Plan and carry out a significant act of service that takes real effort or sacrifice. Do it quietly.'
),

('spiritual', 'Silence & Reflection',
  '10 minutes with no phone, no screen, no music. Just sit with your thoughts.',
  '15 minutes of silent reflection. Ask yourself: who am I becoming?',
  '20 minutes of silence and stillness. No distractions. Journal what surfaces afterwards.',
  '30 minutes of complete silence. Let the noise settle. Write what remains when everything else is gone.'
),

('spiritual', 'Wisdom Reading',
  'Read 5 minutes from a philosophy, religion, or wisdom text. Read slowly — let it land.',
  'Read 10 minutes from a wisdom tradition different from your own. Note 1 idea worth keeping.',
  'Read 15 minutes and write a reflection: what does this mean for how I actually live?',
  'Read 20 minutes and write 1 paragraph connecting the wisdom you read to your life right now.'
),

('spiritual', 'Time in Nature',
  '10-minute walk outside with no headphones. Observe. Let your mind settle.',
  '20-minute walk in nature. No phone. Notice sounds, light, and what is around you.',
  '30-minute walk or sit outside. No phone, no goals. Just be present.',
  '45 minutes in nature with no digital input. Think about who you are and what you are building.'
),

('spiritual', 'Prayer or Deep Intention',
  'Spend 5 minutes in prayer, or speak your intention for the day out loud.',
  'Spend 10 minutes in prayer or intentional reflection. Be honest about what you want and who you are.',
  'Spend 15 minutes in prayer or deep intention-setting. Name your fears, your purpose, your direction.',
  'Spend 20 minutes in committed prayer or deep reflection. Speak it, write it, mean it. No shortcuts.'
),

-- ─────────────────────────────────────────────────────────────
-- 🏠  LIFESTYLE
-- ─────────────────────────────────────────────────────────────

('lifestyle', 'Clean & Organise',
  'Spend 10 minutes tidying 1 area — desk, room, bag. Everything in its place.',
  'Spend 20 minutes doing a full room tidy. Bin or donate anything you do not need.',
  'Spend 30 minutes decluttering. Remove at least 5 items you have not used in 3 months.',
  'Full 45-minute deep clean and reorganise. Your environment should look deliberate and sharp.'
),

('lifestyle', 'Nutrition Win',
  'Drink 2 litres of water today. Track it. Hit the target.',
  'Eat at least 2 proper meals with protein and vegetables. No skipping. Log what you eat.',
  'Plan and prepare a full day of clean eating in advance. Protein, veg, no junk — done before 9am.',
  'Track everything you eat today. Hit your protein target. Zero processed food. No excuses.'
),

('lifestyle', 'Sleep Routine',
  'In bed by your target time. No phone for the final 20 minutes before sleep.',
  'No phone or screen for 30 minutes before bed. Read or sit quietly instead.',
  'Full wind-down: no screens 45 minutes before bed, lights dimmed, tomorrow reviewed, target time hit.',
  'Full sleep optimisation: no screens 1 hour before, journaled, room cool and dark, in bed by 10pm.'
),

('lifestyle', 'Finance Review',
  'Log every expense from today. Know exactly where your money went.',
  'Review your last 7 days of spending. Identify 1 category you can cut.',
  'Review the month so far — income, spending, savings rate. Write what needs to change.',
  'Full financial review: monthly budget vs actual, savings rate, any debt, and 1 concrete action taken today.'
),

('lifestyle', 'Morning Routine',
  'Wake up at your planned time. No snooze. Drink water within 5 minutes of getting up.',
  'Wake at your planned time, drink water, do 5 minutes of movement, write your top 3 tasks for the day.',
  'Wake at planned time, drink water, 10 minutes of movement, 5 minutes journaling, top 3 priorities set.',
  'Complete your full morning protocol before touching your phone. Non-negotiable. Every day.'
),

('lifestyle', 'Treat Yourself',
  'Buy yourself a coffee, a meal, or something small you have been holding off on. Enjoy it without guilt.',
  'Take yourself out properly — a good meal, a film, an activity you have been putting off. No half-measures.',
  'Book and do an experience you have been wanting: a restaurant, a day trip, something that excites you.',
  'A full reward day. Something genuinely indulgent that you have earned through your consistency. Spend on yourself and enjoy every second of it.'
),

('lifestyle', 'Skill Practice',
  'Spend 15 minutes on deliberate practice of a skill you want to develop. Focused, not passive.',
  'Spend 25 minutes on deliberate skill practice. Target something just beyond your current ability.',
  'Spend 40 minutes focused on your weakest area within your chosen skill. Push through discomfort.',
  '60 minutes of deep focused practice on your most important skill. Phone off. No distractions.'
),

('lifestyle', 'Plan Tomorrow',
  'Spend 5 minutes before bed writing your top 3 priorities for tomorrow. Be specific.',
  'Spend 10 minutes planning tomorrow — priorities, key tasks, any prep you need to do now.',
  'Spend 15 minutes planning tomorrow in detail: time blocks, priorities, and any obstacles to address.',
  'Full evening review: what did today achieve, what fell short, and a complete written plan for tomorrow.'
);

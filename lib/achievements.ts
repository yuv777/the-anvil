export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface Achievement {
  id: string
  name: string
  desc: string
  icon: string
  rarity: Rarity
}

export const RARITY_COLORS: Record<Rarity, string> = {
  common:    '#9ca3af',
  rare:      '#60a5fa',
  epic:      '#c084fc',
  legendary: '#c9a227',
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_task',       name: 'First Step',      desc: 'Complete your first task',                  icon: '⚡', rarity: 'common'    },
  { id: 'streak_3',         name: 'On a Roll',        desc: 'Reach a 3-day streak',                      icon: '🔥', rarity: 'common'    },
  { id: 'streak_7',         name: 'Iron Will',        desc: 'Reach a 7-day streak',                      icon: '🗡️', rarity: 'common'    },
  { id: 'streak_30',        name: 'Unbreakable',      desc: 'Reach a 30-day streak',                     icon: '⚔️', rarity: 'rare'      },
  { id: 'streak_100',       name: 'Forge Master',     desc: 'Reach a 100-day streak',                    icon: '👑', rarity: 'legendary' },
  { id: 'perfect_day',      name: 'Perfect',          desc: 'Complete all 5 tasks in one day',           icon: '💎', rarity: 'common'    },
  { id: 'perfect_week',     name: 'Perfect Week',     desc: '7 perfect days in a row',                   icon: '🏆', rarity: 'rare'      },
  { id: 'cold_shower',      name: 'Ice Man',          desc: 'Complete the Cold Shower task',             icon: '🧊', rarity: 'common'    },
  { id: 'stranger_talk',    name: 'Bold Move',        desc: 'Complete a stranger interaction task',      icon: '🤝', rarity: 'common'    },
  { id: 'gold_tier',        name: 'Gold Standard',    desc: 'Reach Gold tier in any category',           icon: '🥇', rarity: 'epic'      },
  { id: 'all_gold',         name: 'The Anvil',        desc: 'Reach Gold tier in all 5 categories',       icon: '⚒️', rarity: 'legendary' },
  { id: 'squad_join',       name: 'Brotherhood',      desc: 'Join your first squad',                     icon: '👥', rarity: 'common'    },
  { id: 'habit_added',      name: 'Architect',        desc: 'Create a custom habit',                     icon: '🏗️', rarity: 'common'    },
  { id: 'use_freeze',       name: 'Survivor',         desc: 'Use a streak freeze',                       icon: '❄️', rarity: 'common'    },
  { id: 'body_logged',      name: 'Data Driven',      desc: 'Log body metrics for the first time',       icon: '📊', rarity: 'common'    },
  { id: 'journal_7',        name: 'The Writer',       desc: 'Write a journal entry 7 days in a row',     icon: '📔', rarity: 'rare'      },
  { id: 'program_complete', name: 'Graduate',         desc: 'Complete a full challenge program',         icon: '🎓', rarity: 'rare'      },
  { id: 'share_card',       name: 'Inspired Others',  desc: 'Share your streak card',                    icon: '🌟', rarity: 'common'    },
  { id: 'night_owl',        name: 'Night Owl',        desc: 'Set a sleep alarm',                         icon: '🦉', rarity: 'common'    },
  { id: 'tier_2',           name: 'Steel Forged',     desc: 'Reach Steel tier overall',                  icon: '🔩', rarity: 'common'    },
  { id: 'tier_3',           name: 'Bronze Warrior',   desc: 'Reach Bronze tier overall',                 icon: '🛡️', rarity: 'rare'      },
  { id: 'tier_4',           name: 'Gold Elite',       desc: 'Reach Gold tier overall',                   icon: '🏅', rarity: 'epic'      },
]

export function getAchievementsToAward(params: {
  currentStreak: number
  longestStreak: number
  overallTier: number
  skillLevels: Record<string, number>
  completedTasksToday: number
  perfectDaysThisWeek: number
  taskNames: string[]
  earnedIds: Set<string>
}): string[] {
  const { currentStreak, overallTier, skillLevels, completedTasksToday,
          perfectDaysThisWeek, taskNames, earnedIds } = params
  const toAward: string[] = []

  function check(id: string, condition: boolean) {
    if (condition && !earnedIds.has(id)) toAward.push(id)
  }

  check('first_task',    completedTasksToday >= 1)
  check('streak_3',      currentStreak >= 3)
  check('streak_7',      currentStreak >= 7)
  check('streak_30',     currentStreak >= 30)
  check('streak_100',    currentStreak >= 100)
  check('perfect_day',   completedTasksToday >= 5)
  check('perfect_week',  perfectDaysThisWeek >= 7)
  check('tier_2',        overallTier >= 2)
  check('tier_3',        overallTier >= 3)
  check('tier_4',        overallTier >= 4)
  check('all_gold',      Object.values(skillLevels).every(t => t >= 4))
  check('gold_tier',     Object.values(skillLevels).some(t => t >= 4))

  const lowerTasks = taskNames.map(n => n.toLowerCase())
  check('cold_shower',   lowerTasks.some(n => n.includes('cold shower')))
  check('stranger_talk', lowerTasks.some(n =>
    n.includes('compliment') || n.includes('approach') || n.includes('stranger') || n.includes('conversation')
  ))

  return toAward
}

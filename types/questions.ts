export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const

export type Difficulty = (typeof DIFFICULTIES)[number]

export type Question = {
  id: number
  level: Difficulty
  question_name: string
  answers: string[]
  correct_answer: number
}

export function isDifficulty(value: unknown): value is Difficulty {
  return DIFFICULTIES.includes(value as Difficulty)
}

export function isQuestion(value: unknown): value is Question {
  if (!value || typeof value !== 'object') return false
  const q = value as Record<string, unknown>
  return (
    typeof q.id === 'number' &&
    isDifficulty(q.level) &&
    typeof q.question_name === 'string' &&
    q.question_name.length > 0 &&
    Array.isArray(q.answers) &&
    q.answers.length === 4 &&
    q.answers.every((answer) => typeof answer === 'string') &&
    typeof q.correct_answer === 'number' &&
    Number.isInteger(q.correct_answer) &&
    q.correct_answer >= 0 &&
    q.correct_answer <= 3
  )
}

export function getCorrectAnswerText(question: Question): string {
  return question.answers[question.correct_answer]
}

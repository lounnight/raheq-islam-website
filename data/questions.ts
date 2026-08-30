import type { Difficulty, Question } from '@/types/questions'
import { isQuestion } from '@/types/questions'

const QUESTIONS_URL =
  'https://cdn.jsdelivr.net/gh/lounnight/raheq-data@main/database/questions/questions.json'

export const QUESTIONS_API_URL = '/api/questions'

export type QuestionStats = {
  easy: number
  medium: number
  hard: number
  total: number
}

export async function loadQuestions(): Promise<Question[]> {
  const response = await fetch(QUESTIONS_URL, {
    next: { revalidate: 3600 },
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch questions — HTTP ${response.status}`)
  }

  const data: unknown = await response.json()

  if (!Array.isArray(data)) {
    throw new Error('Questions data is not an array')
  }

  return data.filter(isQuestion)
}

export function getQuestionStats(questionsList: Question[]): QuestionStats {
  return {
    easy: questionsList.filter((q) => q.level === 'easy').length,
    medium: questionsList.filter((q) => q.level === 'medium').length,
    hard: questionsList.filter((q) => q.level === 'hard').length,
    total: questionsList.length,
  }
}

export function getMaxQuestions(questions: Question[], difficulties: Difficulty[]): number {
  return questions.filter((q) => difficulties.includes(q.level)).length
}

export function selectQuestions(questions: Question[], count: number): Question[] {
  const shuffled = [...questions].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

export async function getQuestions(): Promise<{
  questions: Question[]
  stats: QuestionStats
}> {
  const questions = await loadQuestions()
  const stats = getQuestionStats(questions)
  return { questions, stats }
}
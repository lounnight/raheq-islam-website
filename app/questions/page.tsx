import { QuestionsPage } from '@/components/questions/questions-page'
import { getQuestions } from '@/data/questions'

export default async function Page() {
  const { questions, stats } = await getQuestions()
  return <QuestionsPage questions={questions} stats={stats} />
}

export const dynamic = 'force-dynamic'


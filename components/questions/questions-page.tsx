'use client'

import { useMemo, useState } from 'react'
import { Check, Play, RotateCcw, X } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { getCorrectAnswerText, type Difficulty, type Question } from '@/types/questions'
import type { QuestionStats } from '@/data/questions'

const difficultyLabels: Record<Difficulty, string> = {
  easy: 'سهل',
  medium: 'متوسط',
  hard: 'صعب',
}

const difficultyOptions: Difficulty[] = ['easy', 'medium', 'hard']

type Stage = 'setup' | 'quiz' | 'result'

type QuestionsPageProps = {
  questions: Question[]
  stats: QuestionStats
}

function pickRandom<T>(list: T[], count: number): T[] {
  const shuffled = [...list]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

export function QuestionsPage({ questions, stats }: QuestionsPageProps) {
  const [selected, setSelected] = useState<Difficulty[]>([])
  const [count, setCount] = useState(1)
  const [stage, setStage] = useState<Stage>('setup')
  const [quiz, setQuiz] = useState<Question[]>([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [chosen, setChosen] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const available = useMemo(
    () => questions.filter((q) => selected.includes(q.level)),
    [questions, selected],
  )
  const maxQuestions = available.length
  const safeCount = Math.min(count, maxQuestions)
  const canStart = selected.length > 0 && maxQuestions > 0

  const toggleDifficulty = (difficulty: Difficulty) => {
    setSelected((prev) =>
      prev.includes(difficulty)
        ? prev.filter((d) => d !== difficulty)
        : [...prev, difficulty],
    )
  }

  const start = () => {
    if (!canStart) return
    const picked = pickRandom(available, safeCount)
    setQuiz(picked)
    setAnswers(new Array(picked.length).fill(null))
    setCurrent(0)
    setChosen(null)
    setSubmitted(false)
    setStage('quiz')
  }

  const submit = () => {
    if (chosen === null) return
    setAnswers((prev) => {
      const next = [...prev]
      next[current] = chosen
      return next
    })
    setSubmitted(true)
  }

  const next = () => {
    if (submitted) {
      if (current + 1 < quiz.length) {
        setCurrent(current + 1)
        setChosen(null)
        setSubmitted(false)
      } else {
        setStage('result')
      }
    }
  }

  const restart = () => {
    setStage('setup')
    setQuiz([])
    setAnswers([])
    setCurrent(0)
    setChosen(null)
    setSubmitted(false)
  }

  const currentQuestion = quiz[current]
  const currentCorrect = currentQuestion ? currentQuestion.correct_answer : -1
  const isCurrentCorrect = chosen === currentCorrect
  const correctCount = answers.filter(
    (answer, index) => answer === quiz[index]?.correct_answer,
  ).length
  const wrongCount = answers.length - correctCount

  return (
    <AppShell>
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">اختبر معلوماتك</p>
          <h1 className="text-3xl font-bold tracking-tight">الأسئلة</h1>
          <p className="text-muted-foreground">اختر المستوى وعدد الأسئلة ثم ابدأ الاختبار.</p>
        </header>

        {stage === 'setup' && (
          <section className="flex flex-col gap-6">
            
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'سهل', value: stats.easy },
                { label: 'متوسط', value: stats.medium },
                { label: 'صعب', value: stats.hard },
                { label: 'الإجمالي', value: stats.total },
              ].map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="flex flex-col items-center gap-1 p-4">
                    <Badge variant="secondary">{stat.label}</Badge>
                    <span className="text-2xl font-bold tabular-nums">{stat.value}</span>
                  </CardContent>
                </Card>
              ))}
            </div>

            
            <Card>
              <CardHeader>
                <CardTitle>اختر المستوى</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {difficultyOptions.map((difficulty) => {
                  const active = selected.includes(difficulty)
                  const availableForLevel = questions.filter(
                    (q) => q.level === difficulty,
                  ).length
                  return (
                    <Button
                      key={difficulty}
                      type="button"
                      variant={active ? 'default' : 'outline'}
                      aria-pressed={active}
                      onClick={() => toggleDifficulty(difficulty)}
                      className="h-14 w-full justify-between px-6 text-base"
                    >
                      {difficultyLabels[difficulty]}
                      <Badge variant={active ? 'secondary' : 'outline'}>
                        {availableForLevel}
                      </Badge>
                    </Button>
                  )
                })}
              </CardContent>
            </Card>

            
            <Card>
              <CardHeader>
                <CardTitle>عدد الأسئلة</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  الحد الأقصى المتاح: <span className="font-semibold text-foreground">{maxQuestions}</span> سؤال
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Label htmlFor="question-count" className="sr-only">
                    عدد الأسئلة
                  </Label>
                  <Input
                    id="question-count"
                    type="number"
                    min={1}
                    max={Math.max(1, maxQuestions)}
                    value={maxQuestions > 0 ? safeCount : 0}
                    disabled={!canStart}
                    onChange={(event) => {
                      const parsed = Number.parseInt(event.target.value, 10)
                      if (Number.isNaN(parsed)) setCount(1)
                      else setCount(Math.min(Math.max(1, parsed), Math.max(1, maxQuestions)))
                    }}
                    className="w-28 text-center"
                  />
                  <Button onClick={start} disabled={!canStart}>
                    <Play className="size-4" data-icon="inline-start" />
                    ابدأ الاختبار
                  </Button>
                </div>
                {!canStart && (
                  <p className="text-sm text-muted-foreground">
                    اختر مستوى واحدًا على الأقل لبدء الاختبار.
                  </p>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {stage === 'quiz' && currentQuestion && (
          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4">
              <Badge variant="secondary">{difficultyLabels[currentQuestion.level]}</Badge>
              <span className="text-sm tabular-nums text-muted-foreground">
                السؤال {current + 1} من {quiz.length}
              </span>
            </div>
            <Progress value={((current + 1) / quiz.length) * 100} />

            <Card>
              <CardHeader>
                <CardTitle className="text-xl leading-relaxed">
                  {currentQuestion.question_name}
                </CardTitle>
              </CardHeader>
            </Card>

            <RadioGroup
              value={chosen !== null ? String(chosen) : ''}
              onValueChange={(value) => !submitted && setChosen(Number(value))}
              className="grid gap-3 sm:grid-cols-2"
            >
              {currentQuestion.answers.map((answer, index) => {
                const isCorrectAnswer = index === currentCorrect
                const isChosen = chosen === index
                const showResultVariant =
                  submitted && isCorrectAnswer
                    ? 'default'
                    : submitted && isChosen && !isCorrectAnswer
                      ? 'destructive'
                      : 'outline'
                return (
                  <Card
                    key={index}
                    onClick={() => !submitted && setChosen(index)}
                    className={
                      (!submitted && isChosen
                        ? 'border-primary'
                        : submitted && isCorrectAnswer
                          ? 'border-primary'
                          : submitted && isChosen
                            ? 'border-destructive'
                            : '') + (submitted ? '' : ' cursor-pointer')
                    }
                  >
                    <CardContent className="flex items-center justify-between gap-3 p-4">
                      <Label
                        htmlFor={`answer-${index}`}
                        className="flex flex-1 cursor-pointer items-center gap-3 text-sm font-medium leading-relaxed"
                      >
                        <RadioGroupItem
                          id={`answer-${index}`}
                          value={String(index)}
                          disabled={submitted}
                        />
                        <span>{answer}</span>
                      </Label>
                      {submitted && isCorrectAnswer && (
                        <Badge variant="default" className="gap-1">
                          <Check className="size-3.5" aria-hidden="true" />
                        </Badge>
                      )}
                      {submitted && isChosen && !isCorrectAnswer && (
                        <Badge variant="destructive" className="gap-1">
                          <X className="size-3.5" aria-hidden="true" />
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </RadioGroup>

            {submitted && (
              <Card>
                <CardContent className="flex flex-col gap-2 p-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={isCurrentCorrect ? 'default' : 'destructive'}>
                      {isCurrentCorrect ? 'إجابة صحيحة' : 'إجابة خاطئة'}
                    </Badge>
                  </div>
                  <Separator />
                  <p className="text-sm text-muted-foreground">
                    الإجابة الصحيحة:{' '}
                    <span className="font-semibold text-foreground">
                      {getCorrectAnswerText(currentQuestion)}
                    </span>
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-2">
              {!submitted ? (
                <Button onClick={submit} disabled={chosen === null}>
                  تؤكد الإجابة
                </Button>
              ) : (
                <Button onClick={next}>
                  {current + 1 < quiz.length ? 'السؤال التالي' : 'عرض النتيجة'}
                </Button>
              )}
            </div>
          </section>
        )}

        {stage === 'result' && (
          <section className="flex flex-col gap-6">
            <Card>
              <CardContent className="flex flex-col items-center gap-5 p-6 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">نتيجتك</p>
                  <p className="mt-2 text-5xl font-bold tabular-nums">
                    {quiz.length > 0 ? Math.round((correctCount / quiz.length) * 100) : 0}٪
                  </p>
                </div>
                <Separator className="w-full max-w-xs" />
                <div className="flex justify-center gap-3">
                  <Badge variant="default" className="gap-1.5 px-3 py-1 text-sm">
                    <Check className="size-4" aria-hidden="true" />
                    إجابات صحيحة: {correctCount}
                  </Badge>
                  <Badge variant="destructive" className="gap-1.5 px-3 py-1 text-sm">
                    <X className="size-4" aria-hidden="true" />
                    إجابات خاطئة: {wrongCount}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            
            <div className="flex flex-col gap-3">
              {quiz.map((question, index) => {
                const right = answers[index] === question.correct_answer
                return (
                  <Card key={question.id}>
                    <CardContent className="flex items-start justify-between gap-4 p-4">
                      <div>
                        <p className="font-medium leading-relaxed">
                          {index + 1}. {question.question_name}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          الإجابة الصحيحة:{' '}
                          <span className="font-semibold text-foreground">
                            {getCorrectAnswerText(question)}
                          </span>
                        </p>
                      </div>
                      <Badge variant={right ? 'default' : 'destructive'} className="mt-1 shrink-0">
                        {right ? (
                          <Check className="size-3.5" aria-hidden="true" />
                        ) : (
                          <X className="size-3.5" aria-hidden="true" />
                        )}
                      </Badge>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={restart}>
                <RotateCcw className="size-4" data-icon="inline-start" />
                اختبار جديد
              </Button>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  )
}
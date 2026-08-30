import { AdhkarPage } from '@/components/adhkar/adhkar-page'
import { getAdhkar, getDuas } from '@/data/adhkar'

export default async function Page() {
  const [adhkar, duas] = await Promise.all([
    getAdhkar()
      .then((data) => ({ data }))
      .catch(() => ({ data: undefined })),
    getDuas()
      .then((data) => ({ data }))
      .catch(() => ({ data: undefined })),
  ])

  return (
    <AdhkarPage
      data={adhkar.data}
      hasError={!adhkar.data}
      duas={duas.data}
      duasHasError={!duas.data}
    />
  )
}

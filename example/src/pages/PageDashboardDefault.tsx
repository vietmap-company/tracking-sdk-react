import { Dashboard } from '@vietmap/tracking-sdk-react'
import { PageHeader } from './PageHeader'

export function PageDashboardDefault() {
  return (
    <div className='p-6'>
      <PageHeader
        title='Dashboard'
        description='Component <Dashboard /> mặc định — đầy đủ 5 widget, auto-poll mỗi 30s.'
      />
      <Dashboard pollInterval={30_000} />
    </div>
  )
}

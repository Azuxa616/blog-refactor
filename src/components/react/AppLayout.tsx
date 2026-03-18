import { AppProvider } from '@/context/AppContext'
import FloatingActionButton from '@/components/react/FloatingActionButton'
import type { ReactNode } from 'react'

interface AppLayoutProps {
  children: ReactNode
}

function AppLayout({ children }: AppLayoutProps) {
  return (
    <AppProvider>
      {children}
      <FloatingActionButton />
    </AppProvider>
  )
}

export default AppLayout

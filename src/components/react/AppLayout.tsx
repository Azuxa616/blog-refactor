import { AppProvider } from '@/context/AppContext'
import HeaderBar from '@/components/react/HeaderBar'
import FloatingActionButton from '@/components/react/FloatingActionButton'
import type { ReactNode } from 'react'

interface AppLayoutProps {
  children: ReactNode
  isUseSwitch?: boolean
}

function AppLayout({ children, isUseSwitch = true }: AppLayoutProps) {
  return (
    <AppProvider>
      <HeaderBar isUseSwitch={isUseSwitch} />
      {children}
      <FloatingActionButton />
    </AppProvider>
  )
}

export default AppLayout

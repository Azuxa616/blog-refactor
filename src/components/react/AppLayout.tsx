import HeaderBar from '@/components/react/HeaderBar'
import FloatingActionButton from '@/components/react/FloatingActionButton'
import type { ReactNode } from 'react'

interface AppLayoutProps {
  children: ReactNode
  isUseSwitch?: boolean
}

function AppLayout({ children, isUseSwitch = true }: AppLayoutProps) {
  return (
    <>
      <HeaderBar isUseSwitch={isUseSwitch} />
      {children}
      <FloatingActionButton />
    </>
  )
}

export default AppLayout

import { WarningOutlined } from '@ant-design/icons'
import Callout from 'components/Callout'
import { ThemeContext } from 'contexts/themeContext'
import useMobile from 'hooks/Mobile'
import { useContext } from 'react'

export const WarningCallout: React.FC<{
  collapsible?: boolean
}> = ({ collapsible, children }) => {
  const {
    theme: { colors },
  } = useContext(ThemeContext)
  const isMobile = useMobile()
  const collapse = collapsible ?? isMobile
  return (
    <Callout
      style={{
        backgroundColor: colors.background.warn,
        color: colors.text.warn,
        border: '1px solid',
        borderColor: colors.stroke.warn,
      }}
      iconComponent={
        <WarningOutlined
          style={{ fontSize: '1.5rem', color: colors.icon.warn }}
        />
      }
      collapsible={collapse}
    >
      {children}
    </Callout>
  )
}

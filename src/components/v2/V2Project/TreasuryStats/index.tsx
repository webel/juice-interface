import { Skeleton, Space } from 'antd'
import FundingProgressBar from 'components/Project/FundingProgressBar'
import { useContext } from 'react'
import { V2ProjectContext } from 'contexts/v2/projectContext'
import useTerminalCurrentOverflow from 'hooks/v2/contractReader/TerminalCurrentOverflow'

import { VolumeStatLine } from 'components/Project/VolumeStatLine'

import { ThemeContext } from 'contexts/themeContext'

import ProjectBalance from './ProjectBalance'
import DistributedRatio from './DistributedRatio'
import OwnerBalance from './OwnerBalance'

export default function TreasuryStats() {
  const {
    balanceInDistributionLimitCurrency,
    distributionLimit,
    projectId,
    totalVolume,
    isPreviewMode,
    primaryTerminal,
    loading: { distributionLimitLoading },
  } = useContext(V2ProjectContext)

  const {
    theme: { colors },
  } = useContext(ThemeContext)

  const { data: overflow, loading: overflowLoading } =
    useTerminalCurrentOverflow({
      terminal: primaryTerminal,
      projectId,
    })

  const fundingProgressBarLoading =
    (!isPreviewMode && overflowLoading) || distributionLimitLoading

  return (
    <Space direction="vertical" style={{ display: 'flex' }}>
      <VolumeStatLine totalVolume={totalVolume} color={colors.text.primary} />
      <ProjectBalance />
      <DistributedRatio />
      <Skeleton
        loading={fundingProgressBarLoading}
        title={false}
        paragraph={{ rows: 1, width: ['100%'] }}
        active
      >
        {!fundingProgressBarLoading && distributionLimit ? (
          <FundingProgressBar
            targetAmount={distributionLimit}
            balanceInTargetCurrency={balanceInDistributionLimitCurrency}
            overflowAmountInTargetCurrency={overflow}
          />
        ) : null}
      </Skeleton>
      <OwnerBalance />
    </Space>
  )
}

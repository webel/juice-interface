import { Trans } from '@lingui/macro'
import { Button, Space } from 'antd'
import WithdrawModal from 'components/v1/shared/FundingCycle/modals/WithdrawModal'
import TooltipLabel from 'components/TooltipLabel'
import { V1ProjectContext } from 'contexts/v1/projectContext'
import { PayoutMod } from 'models/mods'
import { useContext, useState } from 'react'
import PayoutModsList from 'components/v1/shared/PayoutModsList'

import { hasFundingTarget } from 'utils/v1/fundingCycle'
import { V1CurrencyName } from 'utils/v1/currency'

import { V1CurrencyOption } from 'models/v1/currencyOption'
import { perbicentToPercent } from 'utils/formatNumber'
import SpendingStats from 'components/Project/SpendingStats'
import { useRouter } from 'next/router'

export default function Spending({
  payoutMods,
}: {
  payoutMods: PayoutMod[] | undefined
}) {
  const { projectId, currentFC, isPreviewMode, balanceInCurrency, owner } =
    useContext(V1ProjectContext)

  const [withdrawModalVisible, setWithdrawModalVisible] = useState<boolean>()

  const router = useRouter()

  if (!currentFC) return null

  const target = currentFC.target
  const distributedAmount = currentFC.tapped

  const distributable = target.sub(distributedAmount)

  const distributableAmount = balanceInCurrency?.gt(distributable)
    ? distributable
    : balanceInCurrency

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
          }}
        >
          <SpendingStats
            hasFundingTarget={hasFundingTarget(currentFC)}
            currency={V1CurrencyName(
              currentFC.currency.toNumber() as V1CurrencyOption,
            )}
            distributableAmount={distributableAmount}
            targetAmount={target}
            distributedAmount={distributedAmount}
            feePercentage={perbicentToPercent(currentFC.fee)}
            ownerAddress={owner}
          />

          <Button
            type="ghost"
            size="small"
            onClick={() => setWithdrawModalVisible(true)}
            disabled={isPreviewMode}
          >
            <Trans>Distribute funds</Trans>
          </Button>
        </div>

        {currentFC.target.gt(0) && (
          <div>
            <TooltipLabel
              label={
                <h4 style={{ display: 'inline-block' }}>
                  <Trans>Funding distribution</Trans>
                </h4>
              }
              tip={
                <Trans>
                  Available funds are distributed according to the payouts
                  below.
                </Trans>
              }
            />
            <PayoutModsList
              mods={payoutMods}
              fundingCycle={currentFC}
              projectId={projectId}
              feePerbicent={currentFC.fee}
            />
          </div>
        )}
      </Space>

      <WithdrawModal
        visible={withdrawModalVisible}
        onCancel={() => setWithdrawModalVisible(false)}
        onConfirmed={() => router.reload()}
      />
    </div>
  )
}

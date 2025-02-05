import { FieldBinaryOutlined, PercentageOutlined } from '@ant-design/icons'
import { t, Trans } from '@lingui/macro'
import { Form, Space, Tooltip } from 'antd'
import { useWatch } from 'antd/lib/form/Form'
import { useContext, useEffect, useMemo } from 'react'
import { useSetCreateFurthestPageReached } from 'redux/hooks/EditingCreateFurthestPageReached'
import { Selection } from '../../Selection'
import { SelectionCardProps } from '../../Selection/SelectionCard'
import { Wizard } from '../../Wizard'
import { PageContext } from '../../Wizard/contexts/PageContext'
import { allocationTotalPercentDoNotExceedTotalRule } from '../utils'
import { PayoutsList } from './components/PayoutsList'
import { useAvailablePayoutsSelections, usePayoutsForm } from './hooks'

export const PayoutsPage: React.FC = () => {
  useSetCreateFurthestPageReached('payouts')
  const { goToNextPage, lockPageProgress, unlockPageProgress } =
    useContext(PageContext)
  const { form, initialValues } = usePayoutsForm()
  const availableSelections = useAvailablePayoutsSelections()

  const selection = useWatch('selection', form)
  const payoutsList = useWatch('payoutsList', form)

  const expensesExceedsFundingTarget = useMemo(() => {
    const totalPercent =
      payoutsList?.reduce((acc, allocation) => acc + allocation.percent, 0) ?? 0
    return totalPercent > 100
  }, [payoutsList])

  // Lock the page of the input data is invalid.
  useEffect(() => {
    if (expensesExceedsFundingTarget || !selection) {
      lockPageProgress?.()
      return
    }
    unlockPageProgress?.()
  }, [
    expensesExceedsFundingTarget,
    lockPageProgress,
    selection,
    unlockPageProgress,
  ])

  const isNextEnabled = !!selection && !expensesExceedsFundingTarget

  return (
    <Form
      form={form}
      initialValues={initialValues}
      name="fundingTarget"
      colon={false}
      layout="vertical"
      onFinish={goToNextPage}
      scrollToFirstError
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <h2>
          <Trans>How would you like to distribute payments?</Trans>
        </h2>
        <Form.Item noStyle name="selection">
          <Selection
            disableInteractivity={availableSelections.size === 1}
            defocusOnSelect
            style={{ width: '100%' }}
          >
            <DisabledTooltip
              name="percentages"
              title={t`Percentages`}
              icon={<PercentageOutlined />}
              isDisabled={!availableSelections.has('percentages')}
              fundingTargetDisabledReason={t`zero`}
              description={
                <Trans>
                  Distribute a percentage of all funds received between the
                  entities nominated in the next step.
                </Trans>
              }
            />
            <DisabledTooltip
              name="amounts"
              title={t`Specific Amounts`}
              icon={<FieldBinaryOutlined />}
              isDisabled={!availableSelections.has('amounts')}
              fundingTargetDisabledReason={t`infinite`}
              description={
                <Trans>
                  Distribute a specific amount of funds to each entity nominated
                  in the next step.
                </Trans>
              }
            />
          </Selection>
        </Form.Item>
        {selection && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <h2>
              <Trans>Who's getting paid?</Trans>
            </h2>
            <p>
              <Trans>
                Add wallet addresses or Juicebox projects to receive payouts.
              </Trans>
            </p>
            <Form.Item
              name="payoutsList"
              rules={[allocationTotalPercentDoNotExceedTotalRule()]}
              style={{ marginBottom: 0 }}
            >
              <PayoutsList payoutsSelection={selection} />
            </Form.Item>
          </Space>
        )}
      </Space>
      <Wizard.Page.ButtonControl isNextEnabled={isNextEnabled} />
    </Form>
  )
}

const DisabledTooltip = (
  props: SelectionCardProps & { fundingTargetDisabledReason: string },
) => (
  <Tooltip
    title={
      props.isDisabled ? (
        <Trans>
          {props.title} is disabled when <b>Funding Target</b> is{' '}
          {props.fundingTargetDisabledReason}.
        </Trans>
      ) : undefined
    }
  >
    <div>
      <Selection.Card {...props} />
    </div>
  </Tooltip>
)

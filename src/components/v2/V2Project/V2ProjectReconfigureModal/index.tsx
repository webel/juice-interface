import { t, Trans } from '@lingui/macro'
import { Modal, Space } from 'antd'
import { ThemeContext } from 'contexts/themeContext'
import { useCallback, useContext, useState } from 'react'
import { CaretRightFilled } from '@ant-design/icons'

import UnsavedChangesModal from 'components/v2/shared/UnsavedChangesModal'

import FundingDrawer from 'components/v2/shared/FundingCycleConfigurationDrawers/FundingDrawer'

import TokenDrawer from 'components/v2/shared/FundingCycleConfigurationDrawers/TokenDrawer'

import RulesDrawer from 'components/v2/shared/FundingCycleConfigurationDrawers/RulesDrawer'
import { useLocation } from 'react-router-dom'

import { V2ReconfigureProjectDetailsDrawer } from './drawers/V2ReconfigureProjectDetailsDrawer'
import V2ReconfigureUpcomingMessage from './V2ReconfigureUpcomingMessage'
import ReconfigurePreview from './ReconfigurePreview'
import { useEditingProjectData } from './hooks/editingProjectData'
import { useFundingHasSavedChanges } from './hooks/fundingHasSavedChanges'
import { useReconfigureFundingCycle } from './hooks/reconfigureFundingCycle'
import { useInitialEditingData } from './hooks/initialEditingData'

function ReconfigureButton({
  title,
  reconfigureHasChanges,
  onClick,
}: {
  title: string
  reconfigureHasChanges: boolean
  onClick: () => void
}) {
  const { colors, radii } = useContext(ThemeContext).theme

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        cursor: 'pointer',
        padding: 10,
        fontWeight: 500,
        borderRadius: radii.sm,
        border:
          '1px solid ' +
          (reconfigureHasChanges
            ? colors.stroke.action.primary
            : colors.stroke.action.secondary),
      }}
      onClick={onClick}
    >
      <div>{title}</div>
      <div>
        <CaretRightFilled />
      </div>
    </div>
  )
}

export const FundingDrawersSubtitles = (
  <p>
    <Trans>
      Updates you make to this section will only be applied to <i>upcoming</i>{' '}
      funding cycles.
    </Trans>
  </p>
)

export default function V2ProjectReconfigureModal({
  visible,
  onOk: exit,
  onCancel,
  hideProjectDetails,
}: {
  visible: boolean
  onOk: VoidFunction
  onCancel: VoidFunction
  hideProjectDetails?: boolean
}) {
  // Checks URL to see if fundingDrawer is already opened
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const initialFundingDrawerVisible = Boolean(params.get('fundingDrawerOpen'))

  const { initialEditingData } = useInitialEditingData(visible)
  const editingProjectData = useEditingProjectData()
  const {
    fundingHasSavedChanges,
    fundingDrawerHasSavedChanges,
    tokenDrawerHasSavedChanges,
    rulesDrawerHasSavedChanges,
  } = useFundingHasSavedChanges({
    editingProjectData,
    initialEditingData,
  })
  const { reconfigureLoading, reconfigureFundingCycle } =
    useReconfigureFundingCycle({ editingProjectData, exit })

  const [projectDetailsDrawerVisible, setProjectDetailsDrawerVisible] =
    useState<boolean>(false)
  const [fundingDrawerVisible, setFundingDrawerVisible] = useState<boolean>(
    initialFundingDrawerVisible,
  )
  const [tokenDrawerVisible, setTokenDrawerVisible] = useState<boolean>(false)
  const [rulesDrawerVisible, setRulesDrawerVisible] = useState<boolean>(false)

  const closeReconfigureDrawer = () => {
    setFundingDrawerVisible(false)
    setTokenDrawerVisible(false)
    setRulesDrawerVisible(false)
  }

  const [unsavedChangesModalVisibile, setUnsavedChangesModalVisible] =
    useState<boolean>(false)

  const openUnsavedChangesModal = () => setUnsavedChangesModalVisible(true)
  const closeUnsavedChangesModal = () => setUnsavedChangesModalVisible(false)

  const closeUnsavedChangesModalAndExit = () => {
    closeUnsavedChangesModal()
    onCancel()
  }

  const handleGlobalModalClose = useCallback(() => {
    if (!fundingHasSavedChanges) {
      return onCancel()
    }
    openUnsavedChangesModal()
  }, [fundingHasSavedChanges, onCancel])

  return (
    <Modal
      title={<Trans>Project configuration</Trans>}
      visible={visible}
      onOk={reconfigureFundingCycle}
      onCancel={handleGlobalModalClose}
      okText={t`Deploy funding cycle configuration`}
      okButtonProps={{
        disabled: !fundingHasSavedChanges,
        style: { marginBottom: '15px' },
      }}
      confirmLoading={reconfigureLoading}
      width={650}
      style={{ paddingBottom: 20, paddingTop: 20 }}
      centered
      destroyOnClose
    >
      <Space
        direction="vertical"
        size="middle"
        style={{ width: '100%', marginBottom: 40 }}
      >
        {hideProjectDetails ? null : (
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ marginBottom: 0 }}>
              <Trans>Edit project details</Trans>
            </h4>
            <p>
              <Trans>
                Changes to project details will take effect immediately.
              </Trans>
            </p>
            <ReconfigureButton
              reconfigureHasChanges={false}
              title={t`Project details`}
              onClick={() => setProjectDetailsDrawerVisible(true)}
            />
          </div>
        )}

        <h4 style={{ marginBottom: 0 }}>
          <Trans>Reconfigure upcoming funding cycles</Trans>
        </h4>
        <p>
          <V2ReconfigureUpcomingMessage />
        </p>
        <ReconfigureButton
          title={t`Distribution limit, duration and payouts`}
          reconfigureHasChanges={fundingDrawerHasSavedChanges}
          onClick={() => setFundingDrawerVisible(true)}
        />
        <ReconfigureButton
          title={t`Token`}
          reconfigureHasChanges={tokenDrawerHasSavedChanges}
          onClick={() => setTokenDrawerVisible(true)}
        />
        <ReconfigureButton
          title={t`Rules`}
          reconfigureHasChanges={rulesDrawerHasSavedChanges}
          onClick={() => setRulesDrawerVisible(true)}
        />
      </Space>
      <ReconfigurePreview
        payoutSplits={editingProjectData.editingPayoutGroupedSplits.splits}
        reserveSplits={
          editingProjectData.editingReservedTokensGroupedSplits.splits
        }
        fundingCycleMetadata={editingProjectData.editingFundingCycleMetadata}
        fundingCycleData={editingProjectData.editingFundingCycleData}
        fundAccessConstraints={editingProjectData.editingFundAccessConstraints}
      />
      {hideProjectDetails ? null : (
        <V2ReconfigureProjectDetailsDrawer
          visible={projectDetailsDrawerVisible}
          onFinish={() => setProjectDetailsDrawerVisible(false)}
        />
      )}
      <FundingDrawer
        visible={fundingDrawerVisible}
        onClose={closeReconfigureDrawer}
      />
      <TokenDrawer
        visible={tokenDrawerVisible}
        onClose={closeReconfigureDrawer}
      />
      <RulesDrawer
        visible={rulesDrawerVisible}
        onClose={closeReconfigureDrawer}
      />
      <UnsavedChangesModal
        visible={unsavedChangesModalVisibile}
        onOk={closeUnsavedChangesModalAndExit}
        onCancel={closeUnsavedChangesModal}
      />
    </Modal>
  )
}

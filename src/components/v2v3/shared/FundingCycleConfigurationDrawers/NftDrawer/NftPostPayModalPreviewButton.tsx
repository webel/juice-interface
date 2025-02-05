import { EyeOutlined } from '@ant-design/icons'
import { Trans } from '@lingui/macro'
import { Button, FormInstance } from 'antd'
import { useWatch } from 'antd/lib/form/Form'
import { NftPostPayModal } from 'components/NftRewards/NftPostPayModal'
import { useState } from 'react'
import { NftPostPayModalFormFields } from './formFields'

export function NftPostPayModalPreviewButton({
  form,
}: {
  form: FormInstance<NftPostPayModalFormFields>
}) {
  const [modalVisible, setModalVisible] = useState<boolean>(false)
  return (
    <>
      <Button
        disabled={!useWatch('content', form)}
        onClick={() => setModalVisible(true)}
        type={'ghost'}
      >
        <Trans>Preview</Trans>
        <EyeOutlined style={{ marginLeft: 10 }} />
      </Button>
      <NftPostPayModal
        open={modalVisible}
        config={form.getFieldsValue(true)}
        onClose={() => setModalVisible(false)}
      />
    </>
  )
}

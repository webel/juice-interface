import { t } from '@lingui/macro'
import { Form, Input, Tooltip } from 'antd'
import { SmileOutlined } from '@ant-design/icons'
import { AttachStickerModal } from 'components/shared/modals/AttachStickerModal'
import { useContext, useState } from 'react'
import { ThemeContext } from 'contexts/themeContext'

export default function MemoFormItem({
  value,
  onChange,
}: {
  value: string
  onChange: (memo: string) => void
}) {
  const {
    theme: { colors },
  } = useContext(ThemeContext)

  const [attachStickerModalVisible, setAttachStickerModalVisible] =
    useState<boolean>(false)

  return (
    <Form.Item
      label={t`Memo (optional)`}
      className={'antd-no-number-handler'}
      extra={t`Add an on-chain memo to this payment.`}
    >
      <div
        style={{
          position: 'relative',
        }}
      >
        <Input.TextArea
          placeholder={t`WAGMI!`}
          maxLength={256}
          value={value}
          onChange={e => onChange(e.target.value)}
          showCount
          autoSize
        />
        <div
          style={{
            color: colors.text.secondary,
            fontSize: '.8rem',
            position: 'absolute',
            right: 5,
            top: 7,
          }}
        >
          <Tooltip title={t`Attach a sticker`}>
            <SmileOutlined onClick={() => setAttachStickerModalVisible(true)} />
          </Tooltip>
        </div>
      </div>
      <AttachStickerModal
        visible={attachStickerModalVisible}
        onClose={() => setAttachStickerModalVisible(false)}
        onSelect={sticker => {
          const url = new URL(`${window.location.origin}${sticker.filepath}`)
          const urlString = url.toString()

          onChange(value.length ? `${value} ${urlString}` : urlString)
        }}
      />
    </Form.Item>
  )
}

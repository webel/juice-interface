import { InfoCircleOutlined } from '@ant-design/icons'
import { t, Trans } from '@lingui/macro'
import { Button } from 'antd'
import Search from 'antd/lib/input/Search'
import { AppWrapper } from 'components/common'
import ExternalLink from 'components/ExternalLink'
import { PV_V1, PV_V1_1, PV_V2 } from 'constants/pv'
import { layouts } from 'constants/styles/layouts'
import { useWallet } from 'hooks/Wallet'
import { ProjectCategory } from 'models/project-visibility'
import { PV } from 'models/pv'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { helpPagePath } from 'utils/routes'

import AllProjects from './AllProjects'
import ArchivedProjectsMessage from './ArchivedProjectsMessage'
import HoldingsProjects from './HoldingsProjects'
import LatestProjects from './LatestProjects'
import MyProjects from './MyProjects'
import ProjectsFilterAndSort from './ProjectsFilterAndSort'
import ProjectsTabs from './ProjectsTabs'
import TrendingProjects from './TrendingProjects'

export default function ProjectsPage() {
  return (
    <AppWrapper>
      <Projects />
    </AppWrapper>
  )
}

type OrderByOption = 'createdAt' | 'totalPaid'

const defaultTab: ProjectCategory = 'trending'

function Projects() {
  const [selectedTab, setSelectedTab] = useState<ProjectCategory>(defaultTab)

  // Checks URL to see if tab has been set
  const router = useRouter()
  const search = Array.isArray(router.query.search)
    ? router.query.search[0]
    : router.query.search

  const { userAddress } = useWallet()
  const [searchText, setSearchText] = useState<typeof search>(search)

  useEffect(() => {
    setSelectedTab(() => {
      switch (router.query.tab) {
        case 'trending':
          return 'trending'
        case 'all':
          return 'all'
        case 'new':
          return 'new'
        case 'holdings':
          return 'holdings'
        case 'myprojects':
          return 'myprojects'
        default:
          return defaultTab
      }
    })
    setSearchText(search)
  }, [userAddress, router.query.tab, search])

  const [orderBy, setOrderBy] = useState<OrderByOption>('totalPaid')
  const [includeV1, setIncludeV1] = useState<boolean>(true)
  const [includeV1_1, setIncludeV1_1] = useState<boolean>(true)
  const [includeV2, setIncludeV2] = useState<boolean>(true)
  const [showArchived, setShowArchived] = useState<boolean>(false)

  const pv: PV[] | undefined = useMemo(() => {
    const _pv: PV[] = []
    if (includeV1) _pv.push(PV_V1)
    if (includeV1_1) _pv.push(PV_V1_1)
    if (includeV2) _pv.push(PV_V2)
    return _pv.length ? _pv : [PV_V1, PV_V1_1, PV_V2]
  }, [includeV1, includeV1_1, includeV2])

  return (
    <div style={{ ...layouts.maxWidth }}>
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            paddingBottom: '12px',
          }}
        >
          <h1>
            <Trans>Projects on Juicebox</Trans>
          </h1>

          <Link href="/create">
            <a>
              <Button type="primary" size="large">
                <Trans>Create project</Trans>
              </Button>
            </a>
          </Link>
        </div>

        <div>
          <p style={{ maxWidth: 800, marginBottom: 20 }}>
            <Trans>
              <InfoCircleOutlined /> The Juicebox protocol is open to anyone,
              and project configurations can vary widely. There are risks
              associated with interacting with all projects on the protocol.
              Projects built on the protocol are not endorsed or vetted by
              JuiceboxDAO or Peel. Do your own research and understand the{' '}
              <ExternalLink href={helpPagePath('/dev/learn/risks')}>
                risks
              </ExternalLink>{' '}
              before committing your funds.
            </Trans>
          </p>
        </div>

        <Search
          autoFocus
          style={{ flex: 1, marginBottom: 20, marginRight: 20 }}
          prefix="@"
          placeholder={t`Search projects by handle`}
          onSearch={val => {
            setSearchText(val)
            router.push(`/projects?tab=all${val ? `&search=${val}` : ''}`)
          }}
          defaultValue={searchText}
          key={searchText}
          allowClear
        />

        <div
          hidden={!!searchText}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            maxWidth: '100vw',
          }}
        >
          <ProjectsTabs selectedTab={selectedTab} />

          {selectedTab === 'all' ? (
            <ProjectsFilterAndSort
              includeV1={includeV1}
              includeV1_1={includeV1_1}
              includeV2={includeV2}
              setIncludeV1={setIncludeV1}
              setIncludeV1_1={setIncludeV1_1}
              setIncludeV2={setIncludeV2}
              showArchived={showArchived}
              setShowArchived={setShowArchived}
              orderBy={orderBy}
              setOrderBy={setOrderBy}
            />
          ) : null}
        </div>
        <ArchivedProjectsMessage
          hidden={!showArchived || selectedTab !== 'all'}
        />
      </div>

      {selectedTab === 'all' ? (
        <div style={{ paddingBottom: 50 }}>
          <AllProjects
            pv={pv}
            searchText={searchText}
            orderBy={orderBy}
            showArchived={showArchived}
          />
        </div>
      ) : selectedTab === 'holdings' ? (
        <div style={{ paddingBottom: 50 }}>
          <HoldingsProjects />
        </div>
      ) : selectedTab === 'myprojects' ? (
        <div style={{ paddingBottom: 50 }}>
          <MyProjects />
        </div>
      ) : selectedTab === 'trending' ? (
        <div style={{ paddingBottom: 50 }}>
          <TrendingProjects count={12} />
        </div>
      ) : selectedTab === 'new' ? (
        <div style={{ paddingBottom: 50 }}>
          <LatestProjects />
        </div>
      ) : null}
    </div>
  )
}

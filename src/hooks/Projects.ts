import { BigNumber } from '@ethersproject/bignumber'

import { useIpfsCache } from 'hooks/IpfsCache'
import { CV } from 'models/cv'
import { IpfsCacheName } from 'models/ipfs-cache/cache-name'
import { ProjectState } from 'models/project-visibility'
import {
  parseTrendingProjectJson,
  Project,
  TrendingProject,
  TrendingProjectJson,
} from 'models/subgraph-entities/vX/project'
import { V1TerminalVersion } from 'models/v1/terminals'
import { useEffect, useMemo, useState } from 'react'
import {
  EntityKeys,
  getSubgraphIdForProject,
  GraphQueryOpts,
  InfiniteGraphQueryOpts,
  querySubgraphExhaustive,
  WhereConfig,
} from 'utils/graph'
import { getTerminalAddress } from 'utils/v1/terminals'
import { uploadIpfsJsonCache } from 'utils/ipfs'

import { SECONDS_IN_DAY } from 'constants/numbers'
import { V1ArchivedProjectIds } from 'constants/v1/archivedProjects'
import { V2ArchivedProjectIds } from 'constants/v2/archivedProjects'

import useSubgraphQuery, { useInfiniteSubgraphQuery } from './SubgraphQuery'

interface ProjectsOptions {
  pageNumber?: number
  projectId?: number
  orderBy?: 'createdAt' | 'currentBalance' | 'totalPaid'
  orderDirection?: 'asc' | 'desc'
  pageSize?: number
  state?: ProjectState
  keys?: (keyof Project)[]
  terminalVersion?: V1TerminalVersion
  cv?: CV[]
}

const staleTime = 60 * 1000 // 60 seconds

const keys: (keyof Project)[] = [
  'id',
  'projectId',
  'handle',
  'owner',
  'createdAt',
  'metadataUri',
  'metadataDomain',
  'currentBalance',
  'totalPaid',
  'totalRedeemed',
  'terminal',
  'cv',
]

const queryOpts = (
  opts: ProjectsOptions,
): Partial<
  | GraphQueryOpts<'project', EntityKeys<'project'>>
  | InfiniteGraphQueryOpts<'project', EntityKeys<'project'>>
> => {
  const where: WhereConfig<'project'>[] = []

  const terminalAddress = getTerminalAddress(opts.terminalVersion)
  const V1ArchivedProjectKeys = V1ArchivedProjectIds.map(projectId =>
    getSubgraphIdForProject('1', projectId),
  )
  const V2ArchivedProjectKeys = V2ArchivedProjectIds.map(projectId =>
    getSubgraphIdForProject('2', projectId),
  )
  const archivedKeys = [...V1ArchivedProjectKeys, ...V2ArchivedProjectKeys]

  if (terminalAddress) {
    where.push({
      key: 'terminal',
      value: terminalAddress,
    })
  }

  if (opts.cv) {
    where.push({
      key: 'cv',
      value: opts.cv,
      operator: 'in',
    })
  }

  if (opts.projectId) {
    where.push({
      key: 'projectId',
      value: opts.projectId,
    })
  } else if (opts.state === 'archived') {
    where.push({
      key: 'id',
      value: archivedKeys,
      operator: 'in',
    })
  } else if (archivedKeys.length) {
    where.push({
      key: 'id',
      value: archivedKeys,
      operator: 'not_in',
    })
  }

  return {
    entity: 'project',
    keys: opts.keys ?? keys,
    orderDirection: opts.orderDirection ?? 'desc',
    orderBy: opts.orderBy ?? 'totalPaid',
    pageSize: opts.pageSize,
    where,
  }
}

export function useProjectsQuery(opts: ProjectsOptions) {
  return useSubgraphQuery(
    {
      ...(queryOpts(opts) as GraphQueryOpts<'project', EntityKeys<'project'>>),
      first: opts.pageSize,
      skip:
        opts.pageNumber && opts.pageSize
          ? opts.pageNumber * opts.pageSize
          : undefined,
    },
    {
      staleTime,
    },
  )
}

export function useProjectsSearch(handle: string | undefined) {
  return useSubgraphQuery(
    handle
      ? {
          text: `${handle}:*`,
          entity: 'projectSearch',
          keys,
        }
      : null,
    {
      staleTime,
    },
  )
}

// Returns projects with highest % volume increase in last week
export function useTrendingProjects(count: number, days: number) {
  const [loadingPayments, setLoadingPayments] = useState<boolean>()
  const [projectStats, setProjectStats] = useState<
    Record<
      string,
      {
        trendingVolume: BigNumber
        paymentsCount: number
      }
    >
  >()

  // Check if remote cache exists
  const cache = useIpfsCache(
    IpfsCacheName.trendingV2,
    useMemo(
      () => ({
        // Cache expires every 12 min, will update 5 times an hour. (Arbitrary)
        ttl: { minutes: 12 },
        deserialize: data => data.map(parseTrendingProjectJson),
      }),
      [],
    ),
  )

  // Cache === null indicates cache is missing or expired
  const shouldUpdateCache = cache === null || (cache && cache?.length < count)

  if (shouldUpdateCache) {
    console.info('Trending cache missing or expired')
  } else if (cache === undefined) {
    console.info('Loading trending cache')
  } else {
    console.info('Using trending cache')
  }

  useEffect(() => {
    const loadPayments = async () => {
      setLoadingPayments(true)

      const daySeconds = days * SECONDS_IN_DAY
      const now = new Date().setUTCHours(0, 0, 0, 0) // get start of day, for determinism
      const nowSeconds = now.valueOf() / 1000

      const payments = await querySubgraphExhaustive({
        entity: 'payEvent',
        keys: [
          'amount',
          {
            entity: 'project',
            keys: ['id'],
          },
        ],
        where: [
          {
            key: 'timestamp',
            value: nowSeconds - daySeconds,
            operator: 'gte',
          },
        ],
      })

      // Project data mapped trending data calculated from payments
      setProjectStats(
        (payments ?? []).reduce(
          (acc, curr) => {
            const projectId = curr.project.id

            return projectId
              ? {
                  ...acc,
                  [projectId]: {
                    trendingVolume: BigNumber.from(
                      acc[projectId]?.trendingVolume ?? 0,
                    ).add(curr.amount),
                    paymentsCount: (acc[projectId]?.paymentsCount ?? 0) + 1,
                  },
                }
              : acc
          },
          {} as Record<
            string,
            {
              trendingVolume: BigNumber
              paymentsCount: number
            }
          >,
        ),
      )

      setLoadingPayments(false)
    }

    if (shouldUpdateCache) loadPayments()
  }, [days, shouldUpdateCache])

  // Query project data for all trending project IDs
  // Only query if cache needs updating
  const projectsQuery = useSubgraphQuery(
    projectStats && shouldUpdateCache
      ? {
          entity: 'project',
          keys,
          where: {
            key: 'id',
            value: Object.keys(projectStats),
            operator: 'in',
          },
        }
      : null,
  )

  const trendingProjectsQuery = {
    ...projectsQuery,
    isLoading:
      projectsQuery.isLoading || loadingPayments || cache === undefined,
    // Return TrendingProjects sorted by `trendingScore`
    data: projectsQuery.data
      ?.map(p => {
        const stats = p.id && projectStats ? projectStats[p.id] : undefined

        // Algorithm to rank trending projects:
        // trendingScore = volume * (number of payments)^2
        const trendingScore = stats?.trendingVolume.mul(
          BigNumber.from(stats.paymentsCount).pow(2),
        )

        return {
          ...p,
          trendingScore,
          trendingVolume: stats?.trendingVolume,
          trendingPaymentsCount: stats?.paymentsCount,
        } as TrendingProject
      })
      .sort((a, b) => (a.trendingScore?.gt(b.trendingScore ?? 0) ? -1 : 1))
      .slice(0, count),
  }

  if (trendingProjectsQuery.data?.length && shouldUpdateCache) {
    // Update cache with new queried data
    uploadIpfsJsonCache(
      IpfsCacheName.trendingV2,
      trendingProjectsQuery.data.map(p =>
        Object.entries(p).reduce(
          (acc, [key, val]) => ({
            ...acc,
            // Serialize all BigNumbers to strings
            [key]: BigNumber.isBigNumber(val) ? val.toString() : val,
          }),
          {} as TrendingProjectJson,
        ),
      ),
    ).then(() => console.info('Uploaded new trending cache'))
  }

  return shouldUpdateCache
    ? trendingProjectsQuery
    : {
        data: cache?.slice(0, count),
        isLoading: cache === undefined,
      }
}

// Query all projects that a wallet has previously made payments to
export function useHoldingsProjectsQuery(wallet: string | undefined) {
  const [loadingParticipants, setLoadingParticipants] = useState<boolean>()
  const [projectIds, setProjectIds] = useState<string[]>()

  useEffect(() => {
    // Get all participant entities for wallet
    const loadParticipants = async () => {
      setLoadingParticipants(true)

      const participants = await querySubgraphExhaustive(
        wallet
          ? {
              entity: 'participant',
              orderBy: 'balance',
              orderDirection: 'desc',
              keys: [
                {
                  entity: 'project',
                  keys: ['id'],
                },
              ],
              where: [
                {
                  key: 'wallet',
                  value: wallet,
                },
              ],
            }
          : null,
      )

      if (!participants) {
        setProjectIds(undefined)
        return
      }

      // Reduce list of paid project ids
      setProjectIds(
        participants?.reduce((acc, curr) => {
          const projectId = curr?.project.id

          return [
            ...acc,
            ...(projectId ? (acc.includes(projectId) ? [] : [projectId]) : []),
          ]
        }, [] as string[]),
      )

      setLoadingParticipants(false)
    }

    loadParticipants()
  }, [wallet])

  const projectsQuery = useSubgraphQuery(
    projectIds
      ? {
          entity: 'project',
          keys,
          where: {
            key: 'id',
            operator: 'in',
            value: projectIds,
          },
        }
      : null,
  )

  return {
    ...projectsQuery,
    isLoading: projectsQuery.isLoading || loadingParticipants,
  }
}

export function useMyProjectsQuery(wallet: string | undefined) {
  const projectsQuery = useSubgraphQuery(
    wallet
      ? {
          entity: 'project',
          keys,
          where: {
            key: 'owner',
            operator: 'in',
            value: [wallet],
          },
        }
      : null,
  )

  return {
    ...projectsQuery,
  }
}

export function useInfiniteProjectsQuery(opts: ProjectsOptions) {
  return useInfiniteSubgraphQuery(
    queryOpts(opts) as InfiniteGraphQueryOpts<'project', EntityKeys<'project'>>,
    { staleTime },
  )
}

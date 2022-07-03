import {
  PinataMetadata,
  PinataPinListResponse,
  PinataPinResponse,
} from '@pinata/sdk'
import axios from 'axios'

import { IpfsCacheJsonData } from 'models/ipfs-cache/cache-data'
import { IpfsCacheName } from 'models/ipfs-cache/cache-name'
import { consolidateMetadata, ProjectMetadataV4 } from 'models/project-metadata'

import { readNetwork } from 'constants/networks'
import { IPFS_GATEWAY_HOSTNAME } from 'constants/ipfs'

const JUICEBOX_API_HOSTNAME = 'api.juicebox.money'
const axiosInstance = axios.create({
  baseURL: `https://${JUICEBOX_API_HOSTNAME}/api`,
})

export const IPFS_TAGS = {
  [IpfsCacheName.trending]:
    (process.env.NODE_ENV === 'production'
      ? 'trending_projects_'
      : 'DEV_trending_projects_') + readNetwork.name,
  [IpfsCacheName.trendingV2]:
    (process.env.NODE_ENV === 'production'
      ? 'trending_projects_v2_'
      : 'DEV_trending_projects_v2_') + readNetwork.name,
  METADATA:
    process.env.NODE_ENV === 'production'
      ? 'juicebox_project_metadata'
      : 'DEV_juicebox_project_metadata',
  LOGO:
    process.env.NODE_ENV === 'production'
      ? 'juicebox_project_logo'
      : 'DEV_juicebox_project_logo',
}

// keyvalues will be upserted to existing metadata. A null value will remove an existing keyvalue
export const editMetadataForCid = async (
  cid: string | undefined,
  options?: PinataMetadata,
) => {
  if (!cid) return undefined

  const pinRes = await axiosInstance.put(`/ipfs/pin/${cid}`, { ...options })

  return pinRes.data
}

export const logoNameForHandle = (handle: string) => `juicebox-@${handle}-logo`

export const metadataNameForHandle = (handle: string) =>
  `juicebox-@${handle}-metadata`

export const ipfsCidUrl = (hash: string) =>
  `https://${IPFS_GATEWAY_HOSTNAME}/ipfs/${hash}`

export const cidFromUrl = (url: string | undefined) => url?.split('/').pop()

export const pinFileToIpfs = async (
  file: File | Blob | string,
  metadata?: PinataMetadata,
) => {
  const data = new FormData()

  data.append('file', file)

  if (metadata) {
    data.append(
      'pinataMetadata',
      JSON.stringify({
        keyvalues: metadata,
      }),
    )
  }

  const res = await axiosInstance.post('/ipfs/logo', data)

  return res.data as PinataPinResponse
}

export const uploadProjectMetadata = async (
  metadata: Omit<ProjectMetadataV4, 'version'>,
  handle?: string,
) => {
  const res = await axiosInstance.post('/ipfs/pin', {
    data: consolidateMetadata(metadata),
    options: {
      pinataMetadata: {
        keyvalues: {
          tag: IPFS_TAGS.METADATA,
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        name: handle
          ? metadataNameForHandle(handle)
          : 'juicebox-project-metadata.json',
      },
    },
  })

  return res.data as PinataPinResponse
}

export const uploadIpfsJsonCache = async <T extends IpfsCacheName>(
  tag: T,
  data: IpfsCacheJsonData[T],
) => {
  return await axiosInstance.post('/ipfs/pin', {
    data,
    options: {
      pinataMetadata: {
        keyvalues: {
          tag: IPFS_TAGS[tag],
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        name: IPFS_TAGS[tag] + '.json',
      },
    },
  })
}

export const getPinnedListByTag = async (tag: keyof typeof IPFS_TAGS) => {
  const data = await axiosInstance.get(`/ipfs/pin?tag=${IPFS_TAGS[tag]}`)

  return data.data as PinataPinListResponse
}

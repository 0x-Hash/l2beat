import { Layer2 } from '@l2beat/config'
import {
  ActivityApiChart,
  ActivityApiResponse,
  VerificationStatus,
} from '@l2beat/shared-pure'

import { getMaxTps } from '../../../../utils/activity/getMaxTps'
import { getTpsDaily } from '../../../../utils/activity/getTpsDaily'
import { getTpsWeeklyChange } from '../../../../utils/activity/getTpsWeeklyChange'
import { getTransactionCount } from '../../../../utils/activity/getTransactionCount'
import { isAnySectionUnderReview } from '../../../../utils/project/isAnySectionUnderReview'
import {
  ActivityPagesData,
  ActivityViewEntry,
  ActivityViewEntryData,
} from '../types'
import { ScalingActivityViewProps } from '../view/ScalingActivityView'

export function getScalingActivityView(
  projects: Layer2[],
  pagesData: ActivityPagesData,
): ScalingActivityViewProps {
  const { activityApiResponse, verificationStatus } = pagesData

  const included = getIncludedProjects(projects)
  const items = [
    ...included.map((x) =>
      getScalingActivityViewEntry(x, activityApiResponse, verificationStatus),
    ),
    getEthereumActivityViewEntry(activityApiResponse),
  ]

  return {
    items: items.sort(
      (a, b) => (b.data?.tpsDaily ?? -1) - (a.data?.tpsDaily ?? -1),
    ),
  }
}

export function getScalingActivityViewEntry(
  project: Layer2,
  activityApiResponse: ActivityApiResponse,
  verificationStatus: VerificationStatus,
): ActivityViewEntry {
  const data = activityApiResponse.projects[project.id.toString()]?.daily.data
  const isVerified = verificationStatus.projects[project.id.toString()]

  return {
    name: project.display.name,
    shortName: project.display.shortName,
    slug: project.display.slug,
    category: project.display.category,
    provider: project.display.provider,
    warning: project.display.warning,
    redWarning: project.display.redWarning,
    purposes: project.display.purposes,
    isVerified,
    showProjectUnderReview: isAnySectionUnderReview(project),
    dataSource: project.display.activityDataSource,
    stage: project.stage,
    data: getActivityViewEntryDetails(data, 'project'),
  }
}

function getEthereumActivityViewEntry(
  activityApiResponse: ActivityApiResponse,
): ActivityViewEntry {
  const data = activityApiResponse.combined.daily.data
  return {
    name: 'Ethereum',
    shortName: undefined,
    slug: 'ethereum',
    dataSource: 'Blockchain RPC',
    category: undefined,
    provider: undefined,
    purposes: undefined,
    warning: undefined,
    redWarning: undefined,
    isVerified: undefined,
    showProjectUnderReview: undefined,
    stage: undefined,
    data: getActivityViewEntryDetails(data, 'ethereum'),
  }
}

function getActivityViewEntryDetails(
  data: ActivityApiChart['data'] | undefined,
  type: 'project' | 'ethereum',
): ActivityViewEntryData | undefined {
  if (!data || data.length === 0) {
    return undefined
  }

  return {
    tpsDaily: getTpsDaily(data, type),
    tpsWeeklyChange: getTpsWeeklyChange(data, type),
    transactionsMonthlyCount: getTransactionCount(data, type, 'month'),
    ...getMaxTps(data, type),
  }
}

export function getIncludedProjects<T extends Layer2>(projects: T[]) {
  return projects.filter((x) => !x.isArchived && !x.isUpcoming)
}

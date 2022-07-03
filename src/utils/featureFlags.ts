import { readNetwork } from 'constants/networks'

const FEATURE_FLAG_DEFAULTS: { [k: string]: { [j: string]: boolean } } = {}

const featureFlagKey = (baseKey: string) => {
  return `${baseKey}_${readNetwork.name}`
}

const setFeatureFlag = (featureFlag: string, enabled: boolean) => {
  localStorage.setItem(featureFlagKey(featureFlag), JSON.stringify(enabled))
}

export const enableFeatureFlag = (featureFlag: string) => {
  setFeatureFlag(featureFlag, true)
}

export const disableFeatureFlag = (featureFlag: string) => {
  setFeatureFlag(featureFlag, false)
}

const featureFlagDefaultEnabled = (featureFlag: string) => {
  // if default-enabled for this environment, return true
  const defaultEnabled =
    FEATURE_FLAG_DEFAULTS[featureFlag]?.[readNetwork.name as string]

  return defaultEnabled
}

export const featureFlagEnabled = (featureFlag: string) => {
  // if default-enabled for this environment, return trues
  const defaultEnabled = featureFlagDefaultEnabled(featureFlag)

  try {
    return JSON.parse(
      localStorage.getItem(featureFlagKey(featureFlag)) || `${defaultEnabled}`,
    )
  } catch (e) {
    return defaultEnabled
  }
}

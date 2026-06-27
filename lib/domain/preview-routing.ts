import type { ApplicationCanonicalPath, ApplicationId, IndustryCanonicalPath, IndustryId } from './primitives'

export function resolveIndustryCanonicalPathById(industryId: IndustryId): IndustryCanonicalPath | null {
  switch (industryId) {
    case 'ind_oil_gas':
      return '/industries/oil-gas'
    case 'ind_water':
      return '/industries/water-treatment'
    case 'ind_automation':
      return '/industries/industrial-automation'
    case 'ind_energy':
      return '/industries/energy'
    case 'ind_manufacturing':
      return '/industries/manufacturing'
    default:
      return null
  }
}

export function resolveApplicationCanonicalPathById(applicationId: ApplicationId): ApplicationCanonicalPath | null {
  switch (applicationId) {
    case 'app_high_pressure':
      return '/applications/high-pressure-measurement'
    case 'app_pipeline_monitoring':
      return '/applications/industrial-pipeline-monitoring'
    case 'app_oem_sensor_integration':
      return '/applications/oem-sensor-integration'
    default:
      return null
  }
}

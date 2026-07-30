export type HomeHeroOverlayPresentation = 'inline' | 'spatial'

export type HomeHeroOverlayTagConfig = {
  readonly key: string
  readonly position?: {
    readonly desktop: string
    readonly mobile?: string
  }
  readonly showOnMobile?: boolean
}

export type HomeHeroOverlayConfig = {
  readonly id: 'connect' | 'measure' | 'engineer' | 'solve' | 'control'
  readonly translationKey: string
  readonly titleKey: 'title'
  readonly subtitleKey: 'subtitle'
  readonly helperTextKey: 'helperText'
  readonly mediaLabelKey: 'mediaLabel'
  readonly presentation: HomeHeroOverlayPresentation
  readonly contentClassName: string
  readonly maxMobileTags?: number
  readonly animation?: {
    readonly titleDelay?: number
    readonly subtitleDelay?: number
    readonly tagDelay?: number
    readonly tagStagger?: number
  }
  readonly tags: readonly HomeHeroOverlayTagConfig[]
}

const standardContentPosition = 'left-5 bottom-8 max-w-[calc(100vw-5.75rem)] sm:left-10 sm:bottom-12 sm:max-w-xl md:left-16 lg:left-20 lg:bottom-16 lg:max-w-2xl'

export const homeHeroOverlaySlides = [
  {
    id: 'connect',
    translationKey: 'connect',
    titleKey: 'title',
    subtitleKey: 'subtitle',
    helperTextKey: 'helperText',
    mediaLabelKey: 'mediaLabel',
    presentation: 'inline',
    contentClassName: standardContentPosition,
    maxMobileTags: 2,
    animation: { tagDelay: 0.46, tagStagger: 0.18 },
    tags: [{ key: 'sensors' }, { key: 'data' }, { key: 'connectivity' }],
  },
  {
    id: 'measure',
    translationKey: 'measure',
    titleKey: 'title',
    subtitleKey: 'subtitle',
    helperTextKey: 'helperText',
    mediaLabelKey: 'mediaLabel',
    presentation: 'inline',
    contentClassName: standardContentPosition,
    maxMobileTags: 2,
    animation: { tagDelay: 0.48, tagStagger: 0.2 },
    tags: [{ key: 'pressure' }, { key: 'temperature' }, { key: 'level' }],
  },
  {
    id: 'engineer',
    translationKey: 'engineer',
    titleKey: 'title',
    subtitleKey: 'subtitle',
    helperTextKey: 'helperText',
    mediaLabelKey: 'mediaLabel',
    presentation: 'inline',
    contentClassName: standardContentPosition,
    maxMobileTags: 2,
    animation: { tagDelay: 0.5, tagStagger: 0.18 },
    tags: [{ key: 'engineering' }, { key: 'manufacturing' }, { key: 'customization' }, { key: 'testing' }],
  },
  {
    id: 'solve',
    translationKey: 'solve',
    titleKey: 'title',
    subtitleKey: 'subtitle',
    helperTextKey: 'helperText',
    mediaLabelKey: 'mediaLabel',
    presentation: 'spatial',
    contentClassName: 'left-5 top-7 max-w-[calc(100vw-5.75rem)] sm:left-10 sm:top-12 sm:max-w-xl md:left-16 lg:left-20 lg:top-16 lg:max-w-2xl',
    animation: { tagDelay: 0.68, tagStagger: 0.58 },
    tags: [
      {
        key: 'waterSystems',
        position: {
          desktop: 'left-[8%] top-[26%]',
          mobile: 'max-sm:left-[7%] max-sm:top-[55%]',
        },
      },
      {
        key: 'industrialAutomation',
        showOnMobile: false,
        position: {
          desktop: 'right-[14%] top-[36%]',
        },
      },
      {
        key: 'energy',
        position: {
          desktop: 'left-[18%] bottom-[26%]',
          mobile: 'max-sm:left-[8%] max-sm:bottom-[18%]',
        },
      },
      {
        key: 'machinery',
        position: {
          desktop: 'right-[15%] bottom-[20%]',
          mobile: 'max-sm:right-[8%] max-sm:bottom-[31%]',
        },
      },
    ],
  },
  {
    id: 'control',
    translationKey: 'control',
    titleKey: 'title',
    subtitleKey: 'subtitle',
    helperTextKey: 'helperText',
    mediaLabelKey: 'mediaLabel',
    presentation: 'inline',
    contentClassName: standardContentPosition,
    maxMobileTags: 2,
    animation: { tagDelay: 0.48, tagStagger: 0.2 },
    tags: [{ key: 'solenoidValves' }, { key: 'preciseControl' }, { key: 'applicationSpecificSolutions' }],
  },
] as const satisfies readonly HomeHeroOverlayConfig[]

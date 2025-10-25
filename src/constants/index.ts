const { MODE } = import.meta.env

export const STORAGE_KEYS = {
  ACCESS_TOKEN: `${MODE}_ACCESS_TOKEN`,
  SELECT_KEY: `${MODE}_SELECT_KEY`
} as const

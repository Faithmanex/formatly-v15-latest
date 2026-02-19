import useSWR from "swr"
import { profileService } from "@/lib/database"
import { logger } from "@/lib/logger"

interface FormattingPreferences {
  defaultStyle: string
  defaultFont: string
  fontSize: string
  lineSpacing: string
  includeTOC: boolean
  pageNumbers: string
  margins: string
  citationStyle: string
  englishVariant: string
  reportOnly: boolean
  includeComments: boolean
  preserveFormatting: boolean
}

const DEFAULT_PREFERENCES: FormattingPreferences = {
  defaultStyle: "APA",
  defaultFont: "times",
  fontSize: "12",
  lineSpacing: "double",
  includeTOC: true,
  pageNumbers: "header-right",
  margins: "1",
  citationStyle: "apa",
  englishVariant: "US",
  reportOnly: false,
  includeComments: true,
  preserveFormatting: false,
}

const fetchUserPreferences = async (userId: string): Promise<FormattingPreferences> => {
  try {
    const preferences = await profileService.getUserFormattingPreferences(userId)
    logger.cache("Fetched user preferences", { userId: userId.slice(-8) })

    if (preferences) {
      return {
        ...DEFAULT_PREFERENCES,
        ...preferences,
      }
    }

    return DEFAULT_PREFERENCES
  } catch (error) {
    logger.error("Failed to fetch user preferences", error)
    return DEFAULT_PREFERENCES
  }
}

export function useUserPreferences(userId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<FormattingPreferences>(
    userId ? ["user-preferences", userId] : null,
    () => fetchUserPreferences(userId!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000, // 10 seconds
    },
  )

  const savePreferences = async (preferences: FormattingPreferences) => {
    if (!userId) {
      throw new Error("User ID is required to save preferences")
    }

    try {
      logger.info("Saving user preferences", { userId: userId.slice(-8) })

      // Optimistic update
      mutate(preferences, false)

      // Update in database
      const updatedProfile = await profileService.updateProfile(userId, {
        formatting_preferences: preferences,
        updated_at: new Date().toISOString(),
      })

      if (!updatedProfile) {
        throw new Error("Failed to save preferences")
      }

      logger.info("Preferences saved successfully", { userId: userId.slice(-8) })

      // Revalidate to ensure consistency
      mutate()

      return updatedProfile
    } catch (error) {
      logger.error("Failed to save preferences", error)
      // Revert optimistic update
      mutate()
      throw error
    }
  }

  return {
    preferences: data ?? DEFAULT_PREFERENCES,
    isLoading,
    error,
    savePreferences,
    refresh: mutate,
  }
}

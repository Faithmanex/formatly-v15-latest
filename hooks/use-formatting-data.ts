import useSWR from "swr"
import { formattingStyleService, englishVariantService, customStyleService } from "@/lib/database"
import { logger } from "@/lib/logger"

interface FormattingStyle {
  id: string
  name: string
  code: string
  description?: string
}

interface EnglishVariant {
  id: string
  name: string
  code: string
  description?: string
}

interface CustomStyle {
  id: string
  name: string
  description: string | null
  settings: any
  is_default: boolean
  is_global: boolean
  user_id: string | null
  created_at: string
  updated_at: string
}

const fetchFormattingStyles = async (): Promise<FormattingStyle[]> => {
  try {
    const styles = await formattingStyleService.getFormattingStyles()
    logger.cache("Fetched formatting styles", { count: styles.length })
    return styles
  } catch (error) {
    logger.error("Failed to fetch formatting styles", error)
    return []
  }
}

const fetchEnglishVariants = async (): Promise<EnglishVariant[]> => {
  try {
    const variants = await englishVariantService.getEnglishVariants()
    logger.cache("Fetched English variants", { count: variants.length })
    return variants
  } catch (error) {
    logger.error("Failed to fetch English variants", error)
    return []
  }
}

const fetchCustomStyles = async (userId: string): Promise<CustomStyle[]> => {
  try {
    const styles = await customStyleService.getStyles(userId)
    logger.cache("Fetched custom styles", { userId: userId.slice(-8), count: styles.length })
    return styles
  } catch (error) {
    logger.error("Failed to fetch custom styles", error)
    return []
  }
}

export function useFormattingStyles() {
  const { data, error, isLoading, mutate } = useSWR<FormattingStyle[]>("formatting-styles", fetchFormattingStyles, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000, // 1 minute
  })

  return {
    styles: data ?? [],
    isLoading,
    error,
    refresh: mutate,
  }
}

export function useEnglishVariants() {
  const { data, error, isLoading, mutate } = useSWR<EnglishVariant[]>("english-variants", fetchEnglishVariants, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000, // 1 minute
  })

  return {
    variants: data ?? [],
    isLoading,
    error,
    refresh: mutate,
  }
}

export function useCustomStyles(userId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<CustomStyle[]>(
    userId ? ["custom-styles", userId] : null,
    () => fetchCustomStyles(userId!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // 30 seconds
    },
  )

  return {
    customStyles: data ?? [],
    isLoading,
    error,
    refresh: mutate,
  }
}

export function useFormattingData(userId: string | undefined) {
  const stylesResult = useFormattingStyles()
  const variantsResult = useEnglishVariants()
  const customStylesResult = useCustomStyles(userId)

  return {
    styles: stylesResult.styles,
    variants: variantsResult.variants,
    customStyles: customStylesResult.customStyles,
    isLoading: stylesResult.isLoading || variantsResult.isLoading || customStylesResult.isLoading,
    error: stylesResult.error || variantsResult.error || customStylesResult.error,
    refresh: () => {
      stylesResult.refresh()
      variantsResult.refresh()
      customStylesResult.refresh()
    },
  }
}

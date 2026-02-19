import useSWR from "swr"
import { logger } from "@/lib/logger"

interface JobStatus {
  status: "pending" | "queued" | "processing" | "formatted" | "failed" | "error"
  progress: number
  result_url?: string
  error?: string
}

const fetchJobStatus = async (jobId: string, token: string | null): Promise<JobStatus> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/documents/status/${jobId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch job status: ${response.statusText}`)
    }

    const data = await response.json()
    logger.info("Fetched job status", { jobId: jobId.slice(-8), status: data.status })
    return data
  } catch (error) {
    logger.error("Failed to fetch job status", error)
    throw error
  }
}

export function useDocumentJob(jobId: string | undefined, token: string | null) {
  const { data, error, isLoading } = useSWR<JobStatus>(
    jobId && token ? ["job-status", jobId] : null,
    () => fetchJobStatus(jobId!, token),
    {
      refreshInterval: (data) => {
        // Stop polling if job is complete or failed
        if (data?.status === "formatted" || data?.status === "failed" || data?.status === "error") {
          return 0
        }
        // Poll every 2 seconds while processing
        return 2000
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 1000,
    },
  )

  return {
    status: data?.status,
    progress: data?.progress ?? 0,
    resultUrl: data?.result_url,
    error: data?.error || (error ? "Failed to fetch job status" : undefined),
    isLoading,
    isComplete: data?.status === "formatted",
    isFailed: data?.status === "failed" || data?.status === "error",
  }
}

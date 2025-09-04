export interface Insight {
  id: string
  title: string
  message: string
  insight_type: string
  confidence_score: number
  is_read: boolean
  created_at: string
}
-- AddAIInsightsField
-- Add aiInsights field to Analysis table for storing Claude AI generated insights

ALTER TABLE "analyses" ADD COLUMN "aiInsights" TEXT;

-- Add comment for documentation
COMMENT ON COLUMN "analyses"."aiInsights" IS 'JSON string containing AI-generated insights, constraint suggestions, and predictive analytics';
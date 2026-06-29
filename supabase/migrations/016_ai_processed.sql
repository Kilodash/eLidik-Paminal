-- 016: ai_processed flag for deferred AI enrichment
ALTER TABLE pengaduan ADD COLUMN IF NOT EXISTS ai_processed BOOLEAN DEFAULT false;

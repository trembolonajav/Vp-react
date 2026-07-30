ALTER TABLE reports ADD COLUMN reviewed_by VARCHAR(64) REFERENCES users (id) ON DELETE SET NULL;
ALTER TABLE reports ADD COLUMN reviewed_at TIMESTAMPTZ;
ALTER TABLE reports ADD COLUMN resolution_note VARCHAR(600);

CREATE INDEX idx_reports_status_created ON reports (status, created_at DESC);

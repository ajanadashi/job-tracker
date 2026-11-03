CREATE TABLE applications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company       VARCHAR(200) NOT NULL,
  position      VARCHAR(200) NOT NULL,
  status        VARCHAR(20)  NOT NULL DEFAULT 'applied'
                CHECK (status IN ('wishlist','applied','interviewing','offer','rejected','withdrawn')),
  url           TEXT,
  location      VARCHAR(200),
  salary_range  VARCHAR(200),
  notes         TEXT,
  notify_email  VARCHAR(320),
  applied_at    DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_applications_status ON applications (status);
CREATE INDEX idx_applications_created_at ON applications (created_at DESC);

CREATE TABLE email_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID REFERENCES applications(id) ON DELETE SET NULL,
  to_email        VARCHAR(320) NOT NULL,
  subject         VARCHAR(300) NOT NULL,
  html            TEXT NOT NULL,
  status          VARCHAR(10) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','sent','failed')),
  attempts        INTEGER NOT NULL DEFAULT 0,
  max_attempts    INTEGER NOT NULL DEFAULT 4,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_until    TIMESTAMPTZ,
  last_error      TEXT,
  provider_id     TEXT,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_jobs_due ON email_jobs (next_attempt_at) WHERE status = 'pending';
CREATE INDEX idx_email_jobs_status ON email_jobs (status);

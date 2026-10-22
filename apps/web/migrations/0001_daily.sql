-- Anonymous counts of what is finished (src/lib/count.ts): a name and a daily total, nothing else.
CREATE TABLE IF NOT EXISTS daily (
  day TEXT NOT NULL,
  key TEXT NOT NULL,
  n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, key)
);

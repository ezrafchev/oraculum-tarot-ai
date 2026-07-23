export const userDataSchema = `
CREATE TABLE IF NOT EXISTS user_data (
  user_email TEXT PRIMARY KEY NOT NULL,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`;

export const userDataUpdatedIndex = `
CREATE INDEX IF NOT EXISTS user_data_updated_at_idx
ON user_data(updated_at)`;

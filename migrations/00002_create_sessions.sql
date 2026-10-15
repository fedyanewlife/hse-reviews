-- +goose Up
CREATE TABLE sessions (
    session_token_hash BYTEA PRIMARY KEY,
    user_id            INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at         TIMESTAMPTZ NOT NULL,
    CHECK (octet_length(session_token_hash) = 32),
    CHECK (expires_at > created_at)
);

CREATE INDEX sessions_user_id_idx ON sessions (user_id);

-- +goose Down
DROP TABLE sessions;

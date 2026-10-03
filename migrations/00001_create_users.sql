-- +goose Up
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    issuer        TEXT        NOT NULL,
    subject       TEXT        NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (issuer, subject)
);

-- +goose Down
DROP TABLE users;

package repository

import (
	"context"
	"errors"
	"fmt"
	"net"
	"net/url"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"hse-reviews/internal/config"
)

type Postgres struct {
	pool *pgxpool.Pool
}

func NewPostgres(ctx context.Context, cfg config.DB) (*Postgres, error) {
	connectionURL := url.URL{
		Scheme: "postgres",
		User:   url.UserPassword(cfg.User, cfg.Password),
		Host:   net.JoinHostPort(cfg.Host, cfg.Port),
		Path:   cfg.Name,
	}

	pool, err := pgxpool.New(ctx, connectionURL.String())
	if err != nil {
		return nil, fmt.Errorf("create postgres pool: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping postgres pool: %w", err)
	}

	return &Postgres{pool: pool}, nil
}

func (p *Postgres) Close() {
	p.pool.Close()
}

func (p *Postgres) UpsertUser(ctx context.Context, issuer, subject string) (int32, error) {
	const query = `
		INSERT INTO users (issuer, subject)
		VALUES ($1, $2)
		ON CONFLICT (issuer, subject)
		DO UPDATE SET last_login_at = NOW()
		RETURNING id`

	var id int32
	if err := p.pool.QueryRow(ctx, query, issuer, subject).Scan(&id); err != nil {
		return 0, fmt.Errorf("upsert user: %w", err)
	}
	return id, nil
}

func (p *Postgres) CreateSession(ctx context.Context, userID int32, tokenHash [32]byte, expiresAt time.Time) error {
	const query = `
		INSERT INTO sessions (session_token_hash, user_id, expires_at)
		VALUES ($1, $2, $3)`

	if _, err := p.pool.Exec(ctx, query, tokenHash[:], userID, expiresAt); err != nil {
		return fmt.Errorf("create session: %w", err)
	}
	return nil
}

func (p *Postgres) FindUserIDBySessionHash(ctx context.Context, tokenHash [32]byte) (int32, bool, error) {
	const query = `
		SELECT user_id
		FROM sessions
		WHERE session_token_hash = $1
		  AND expires_at > NOW()`

	var userID int32
	if err := p.pool.QueryRow(ctx, query, tokenHash[:]).Scan(&userID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, false, nil
		}
		return 0, false, fmt.Errorf("find session user: %w", err)
	}
	return userID, true, nil
}

func (p *Postgres) DeleteSession(ctx context.Context, tokenHash [32]byte) error {
	const query = `
		DELETE FROM sessions
		WHERE session_token_hash = $1`

	if _, err := p.pool.Exec(ctx, query, tokenHash[:]); err != nil {
		return fmt.Errorf("delete session: %w", err)
	}
	return nil
}

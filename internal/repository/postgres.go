package repository

import (
	"context"
	"fmt"
	"net"
	"net/url"
	"time"

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

func (p *Postgres) CreateSession(ctx context.Context, userID int32, tokenHash []byte, expiresAt time.Time) error {
	const query = `
		INSERT INTO sessions (session_token_hash, user_id, expires_at)
		VALUES ($1, $2, $3)`

	if _, err := p.pool.Exec(ctx, query, tokenHash, userID, expiresAt); err != nil {
		return fmt.Errorf("create session: %w", err)
	}
	return nil
}

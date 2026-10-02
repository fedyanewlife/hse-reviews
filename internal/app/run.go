package app

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"hse-reviews/internal/auth"
	"hse-reviews/internal/config"
	"hse-reviews/internal/repository"
)

func Run() error {
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("config: %w", err)
	}

	dbCtx, cancelDB := context.WithTimeout(context.Background(), 5*time.Second)
	db, err := repository.NewPostgres(dbCtx, cfg.DB)
	cancelDB()
	if err != nil {
		return fmt.Errorf("repository: %w", err)
	}
	defer db.Close()

	authCtx, cancelAuth := context.WithTimeout(context.Background(), 5*time.Second)
	authProvider, err := auth.NewProvider(authCtx, cfg.Keycloak, db)
	cancelAuth()
	if err != nil {
		return fmt.Errorf("auth: %w", err)
	}

	http.HandleFunc("GET /health", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})
	http.HandleFunc("GET /auth/login", authProvider.Login)
	http.HandleFunc("GET /auth/callback", authProvider.Callback)
	http.Handle("GET /me", authProvider.RequireSession(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.UserIDFromContext(r.Context())
		if !ok {
			http.Error(w, "authentication required", http.StatusUnauthorized)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]int32{"user_id": userID})
	})))

	log.Println("Starting server on localhost:8080")
	return http.ListenAndServe("localhost:8080", nil)
}

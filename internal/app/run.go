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
)

func Run() error {
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("config: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	authProvider, err := auth.NewProvider(ctx, cfg)
	if err != nil {
		return err
	}

	http.HandleFunc("GET /health", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})
	http.HandleFunc("GET /auth/login", authProvider.Login)
	http.HandleFunc("GET /auth/callback", authProvider.Callback)

	log.Println("Starting server on localhost:8080")
	return http.ListenAndServe("localhost:8080", nil)
}

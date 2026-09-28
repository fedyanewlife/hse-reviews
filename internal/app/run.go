package app

import (
	"encoding/json"
	"log"
	"net/http"
)

func Run() error {
	http.HandleFunc("GET /health", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	log.Println("Starting server on localhost:8080")
	return http.ListenAndServe("localhost:8080", nil)
}

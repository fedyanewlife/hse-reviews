package main

import (
	"errors"
	"log"
	"os"

	"github.com/joho/godotenv"

	"hse-reviews/internal/app"
)

func main() {
	if err := godotenv.Load(); err != nil && !errors.Is(err, os.ErrNotExist) {
		log.Fatalf("load .env: %v", err)
	}

	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}

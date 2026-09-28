package main

import (
	"log"

	"hse-reviews/internal/app"
)

func main() {
	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}

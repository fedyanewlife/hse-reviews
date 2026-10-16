package minors

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
)

const queryGetMinors = `SELECT id, name, hse_url FROM minors ORDER BY name`

type Minor struct {
	ID     int32  `json:"id"`
	Name   string `json:"name"`
	HSEURL string `json:"hse_url"`
}

type Handler struct {
	db *pgxpool.Pool
}

func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{db: db}
}

func (h *Handler) GetMinors(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(r.Context(), queryGetMinors)
	if err != nil {
		log.Printf("get minors: %v", err)
		writeError(w, "Не удалось получить список майноров")
		return
	}
	defer rows.Close()

	minors := make([]Minor, 0)
	for rows.Next() {
		var minor Minor
		if err := rows.Scan(&minor.ID, &minor.Name, &minor.HSEURL); err != nil {
			log.Printf("get minors: %v", err)
			writeError(w, "Не удалось получить список майноров")
			return
		}
		minors = append(minors, minor)
	}
	if err := rows.Err(); err != nil {
		log.Printf("get minors: %v", err)
		writeError(w, "Не удалось получить список майноров")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(struct {
		Items []Minor `json:"items"`
	}{Items: minors})
}

func writeError(w http.ResponseWriter, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusInternalServerError)
	_ = json.NewEncoder(w).Encode(map[string]string{
		"error": msg,
	})
}

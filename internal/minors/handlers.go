package minors

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const queryGetMinors = `SELECT id, name, hse_url FROM minors ORDER BY name`
const queryGetMinor = `SELECT id, name, hse_url FROM minors WHERE id = $1`

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
		writeError(w, http.StatusInternalServerError, "Не удалось получить список майноров")
		return
	}
	defer rows.Close()

	minors := make([]Minor, 0)
	for rows.Next() {
		var minor Minor
		if err := rows.Scan(&minor.ID, &minor.Name, &minor.HSEURL); err != nil {
			log.Printf("get minors: %v", err)
			writeError(w, http.StatusInternalServerError, "Не удалось получить список майноров")
			return
		}
		minors = append(minors, minor)
	}
	if err := rows.Err(); err != nil {
		log.Printf("get minors: %v", err)
		writeError(w, http.StatusInternalServerError, "Не удалось получить список майноров")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(struct {
		Items []Minor `json:"items"`
	}{Items: minors})
}

func (h *Handler) GetMinor(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 32)
	if err != nil || id <= 0 {
		writeError(w, http.StatusBadRequest, "Некорректный идентификатор майнора")
		return
	}

	var minor Minor
	err = h.db.QueryRow(r.Context(), queryGetMinor, id).Scan(&minor.ID, &minor.Name, &minor.HSEURL)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeError(w, http.StatusNotFound, "Майнор не найден")
			return
		}
		log.Printf("get minor: %v", err)
		writeError(w, http.StatusInternalServerError, "Не удалось получить майнор")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(minor)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{
		"error": msg,
	})
}

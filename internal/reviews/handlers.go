package reviews

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"hse-reviews/internal/auth"
)

const queryCreateReview = `
	INSERT INTO reviews (
		minor_id, user_id, completion_year,
	    difficulty_rating, workload_rating, interest_rating, usefulness_rating,
		recommendation_rating, experience_text, selection_advice
	)
	VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NULLIF($9, ''), NULLIF($10, ''))
	RETURNING id, status`

type createReviewRequest struct {
	MinorID              int32  `json:"minor_id"`
	CompletionYear       *int   `json:"completion_year"`
	DifficultyRating     int    `json:"difficulty_rating"`
	WorkloadRating       int    `json:"workload_rating"`
	InterestRating       int    `json:"interest_rating"`
	UsefulnessRating     int    `json:"usefulness_rating"`
	RecommendationRating int    `json:"recommendation_rating"`
	ExperienceText       string `json:"experience_text"`
	SelectionAdvice      string `json:"selection_advice"`
}

type Handler struct {
	db *pgxpool.Pool
}

func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{db: db}
}

func (h *Handler) CreateReview(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserIDFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "Необходима авторизация")
		return
	}

	var request createReviewRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		writeError(w, http.StatusBadRequest, "Некорректный JSON запроса")
		return
	}

	if request.MinorID <= 0 {
		writeError(w, http.StatusBadRequest, "Некорректный идентификатор майнора")
		return
	}
	if request.CompletionYear != nil && (*request.CompletionYear < 2025 || *request.CompletionYear > time.Now().Year()) {
		writeError(w, http.StatusBadRequest, "Некорректный год окончания майнора")
		return
	}
	for _, rating := range []int{
		request.DifficultyRating,
		request.WorkloadRating,
		request.InterestRating,
		request.UsefulnessRating,
		request.RecommendationRating,
	} {
		if rating < 1 || rating > 5 {
			writeError(w, http.StatusBadRequest, "Оценки должны быть в диапазоне от 1 до 5")
			return
		}
	}

	var review struct {
		ID     int32  `json:"id"`
		Status string `json:"status"`
	}
	err := h.db.QueryRow(r.Context(), queryCreateReview,
		request.MinorID,
		userID,
		request.CompletionYear,
		request.DifficultyRating,
		request.WorkloadRating,
		request.InterestRating,
		request.UsefulnessRating,
		request.RecommendationRating,
		strings.TrimSpace(request.ExperienceText),
		strings.TrimSpace(request.SelectionAdvice),
	).Scan(&review.ID, &review.Status)
	if err != nil {
		if pgErr, ok := errors.AsType[*pgconn.PgError](err); ok {
			if pgErr.Code == "23503" && pgErr.ConstraintName == "reviews_minor_id_fkey" {
				writeError(w, http.StatusNotFound, "Майнор не найден")
				return
			}
			if pgErr.Code == "23505" && pgErr.ConstraintName == "reviews_user_active_uq" {
				writeError(w, http.StatusConflict, "У вас уже есть отзыв на проверке или опубликованный отзыв")
				return
			}
		}
		log.Printf("create review: %v", err)
		writeError(w, http.StatusInternalServerError, "Не удалось сохранить отзыв")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(review)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{
		"error": msg,
	})
}

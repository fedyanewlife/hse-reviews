package auth

import (
	"context"
	"crypto/sha256"
	"net/http"
)

type userIDContextKey struct{}

func (p *Provider) RequireSession(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie(sessionCookieName)
		if err != nil || cookie.Value == "" {
			http.Error(w, "authentication required", http.StatusUnauthorized)
			return
		}

		tokenHash := sha256.Sum256([]byte(cookie.Value))
		userID, found, err := p.authStore.FindUserIDBySessionHash(r.Context(), tokenHash)
		if err != nil {
			http.Error(w, "failed to validate session", http.StatusInternalServerError)
			return
		}
		if !found {
			p.clearSessionCookie(w)
			http.Error(w, "authentication required", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), userIDContextKey{}, userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func UserIDFromContext(ctx context.Context) (int32, bool) {
	userID, ok := ctx.Value(userIDContextKey{}).(int32)
	return userID, ok
}

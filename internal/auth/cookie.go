package auth

import (
	"fmt"
	"net/http"
	"time"
)

const (
	stateCookieName        = "state"
	nonceCookieName        = "nonce"
	codeVerifierCookieName = "code_verifier"

	cookiePath = "/auth"

	cookieTTL = 5 * time.Minute
)

func (p *Provider) setCookie(w http.ResponseWriter, name, value string) {
	http.SetCookie(w, &http.Cookie{
		Name:     name,
		Value:    value,
		Path:     cookiePath,
		MaxAge:   int(cookieTTL.Seconds()),
		HttpOnly: true,
		Secure:   p.cookieSecure,
		SameSite: http.SameSiteLaxMode,
	})
}

func (p *Provider) getCookie(r *http.Request, name string) (string, error) {
	cookie, err := r.Cookie(name)
	if err != nil || cookie.Value == "" {
		return "", fmt.Errorf("missing authentication cookie: %s", name)
	}
	return cookie.Value, nil
}

func (p *Provider) clearCookie(w http.ResponseWriter, name string) {
	http.SetCookie(w, &http.Cookie{
		Name:     name,
		Value:    "",
		Path:     cookiePath,
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   p.cookieSecure,
		SameSite: http.SameSiteLaxMode,
	})
}

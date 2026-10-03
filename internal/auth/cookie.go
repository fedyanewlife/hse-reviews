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
	sessionCookieName      = "session"

	flowCookiePath    = "/auth"
	sessionCookiePath = "/"

	flowCookieTTL    = 5 * time.Minute
	sessionCookieTTL = 5 * time.Minute
)

func (p *Provider) setFlowCookie(w http.ResponseWriter, name, value string) {
	http.SetCookie(w, &http.Cookie{
		Name:     name,
		Value:    value,
		Path:     flowCookiePath,
		MaxAge:   int(flowCookieTTL.Seconds()),
		HttpOnly: true,
		Secure:   p.cookieSecure,
		SameSite: http.SameSiteLaxMode,
	})
}

func (p *Provider) setSessionCookie(w http.ResponseWriter, value string) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    value,
		Path:     sessionCookiePath,
		MaxAge:   int(sessionCookieTTL.Seconds()),
		HttpOnly: true,
		Secure:   p.cookieSecure,
		SameSite: http.SameSiteLaxMode,
	})
}

func (p *Provider) getFlowCookie(r *http.Request, name string) (string, error) {
	cookie, err := r.Cookie(name)
	if err != nil || cookie.Value == "" {
		return "", fmt.Errorf("missing authentication cookie: %s", name)
	}
	return cookie.Value, nil
}

func (p *Provider) clearFlowCookie(w http.ResponseWriter, name string) {
	http.SetCookie(w, &http.Cookie{
		Name:     name,
		Value:    "",
		Path:     flowCookiePath,
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   p.cookieSecure,
		SameSite: http.SameSiteLaxMode,
	})
}

func (p *Provider) clearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    "",
		Path:     sessionCookiePath,
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   p.cookieSecure,
		SameSite: http.SameSiteLaxMode,
	})
}

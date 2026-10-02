package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"time"

	"golang.org/x/oauth2"
)

func (p *Provider) Login(w http.ResponseWriter, r *http.Request) {
	state := randomValue()
	nonce := randomValue()
	codeVerifier := oauth2.GenerateVerifier()

	p.setFlowCookie(w, stateCookieName, state)
	p.setFlowCookie(w, nonceCookieName, nonce)
	p.setFlowCookie(w, codeVerifierCookieName, codeVerifier)

	redirectURL := p.oauthConfig.AuthCodeURL(
		state,
		oauth2.SetAuthURLParam("nonce", nonce),
		oauth2.S256ChallengeOption(codeVerifier),
	)
	http.Redirect(w, r, redirectURL, http.StatusFound)
}

func (p *Provider) Callback(w http.ResponseWriter, r *http.Request) {
	state, stateErr := p.getFlowCookie(r, stateCookieName)
	nonce, nonceErr := p.getFlowCookie(r, nonceCookieName)
	codeVerifier, verifierErr := p.getFlowCookie(r, codeVerifierCookieName)

	queryState := r.URL.Query().Get("state")
	if stateErr != nil || nonceErr != nil || verifierErr != nil ||
		queryState == "" || subtle.ConstantTimeCompare([]byte(queryState), []byte(state)) != 1 {
		http.Error(w, "invalid authentication state", http.StatusBadRequest)
		return
	}

	p.clearFlowCookie(w, stateCookieName)
	p.clearFlowCookie(w, nonceCookieName)
	p.clearFlowCookie(w, codeVerifierCookieName)

	if errParam := r.URL.Query().Get("error"); errParam != "" {
		http.Error(w, "authentication failed", http.StatusBadRequest)
		return
	}

	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "missing authorization code", http.StatusBadRequest)
		return
	}

	oauth2Token, err := p.oauthConfig.Exchange(r.Context(), code, oauth2.VerifierOption(codeVerifier))
	if err != nil {
		http.Error(w, "token exchange failed", http.StatusBadGateway)
		return
	}

	idToken, ok := oauth2Token.Extra("id_token").(string)
	if !ok {
		http.Error(w, "missing id_token", http.StatusBadGateway)
		return
	}

	token, err := p.verifier.Verify(r.Context(), idToken)
	if err != nil {
		http.Error(w, "token verification failed", http.StatusBadGateway)
		return
	}

	if token.Subject == "" || subtle.ConstantTimeCompare([]byte(token.Nonce), []byte(nonce)) != 1 {
		http.Error(w, "authentication failed", http.StatusBadGateway)
		return
	}

	userID, err := p.authStore.UpsertUser(r.Context(), token.Issuer, token.Subject)
	if err != nil {
		http.Error(w, "failed to save user", http.StatusInternalServerError)
		return
	}

	sessionToken := randomValue()
	sessionTokenHash := sha256.Sum256([]byte(sessionToken))
	expiresAt := time.Now().Add(sessionCookieTTL)
	if err := p.authStore.CreateSession(r.Context(), userID, sessionTokenHash, expiresAt); err != nil {
		http.Error(w, "failed to create session", http.StatusInternalServerError)
		return
	}

	p.setSessionCookie(w, sessionToken)

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{
		"status":  "ok",
		"issuer":  token.Issuer,
		"subject": token.Subject,
	})
}

func randomValue() string {
	value := make([]byte, 32)
	rand.Read(value)
	return base64.URLEncoding.EncodeToString(value)
}

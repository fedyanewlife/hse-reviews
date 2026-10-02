package auth

import (
	"context"
	"errors"
	"fmt"
	"net/url"

	"github.com/coreos/go-oidc/v3/oidc"
	"golang.org/x/oauth2"

	"hse-reviews/internal/config"
)

type Provider struct {
	oauthConfig  oauth2.Config
	verifier     *oidc.IDTokenVerifier
	cookieSecure bool
}

func NewProvider(ctx context.Context, cfg config.Keycloak) (*Provider, error) {
	parsedRedirectURL, err := url.Parse(cfg.OAuthRedirectURL)
	if err != nil || parsedRedirectURL.Host == "" ||
		(parsedRedirectURL.Scheme != "http" && parsedRedirectURL.Scheme != "https") {
		return nil, errors.New("OAUTH_REDIRECT_URL must be absolute HTTP(S)")
	}

	provider, err := oidc.NewProvider(ctx, cfg.IssuerURL)
	if err != nil {
		return nil, fmt.Errorf("init oidc provider: %w", err)
	}

	return &Provider{
		oauthConfig: oauth2.Config{
			ClientID:     cfg.ClientID,
			ClientSecret: cfg.ClientSecret,
			RedirectURL:  cfg.OAuthRedirectURL,
			Endpoint:     provider.Endpoint(),
			Scopes:       []string{oidc.ScopeOpenID},
		},
		verifier:     provider.Verifier(&oidc.Config{ClientID: cfg.ClientID}),
		cookieSecure: parsedRedirectURL.Scheme == "https",
	}, nil
}

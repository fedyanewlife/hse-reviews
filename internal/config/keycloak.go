package config

import (
	"errors"
	"os"
)

type Keycloak struct {
	IssuerURL        string
	ClientID         string
	ClientSecret     string
	OAuthRedirectURL string
}

func loadKeycloak() Keycloak {
	return Keycloak{
		IssuerURL:        os.Getenv("KEYCLOAK_ISSUER_URL"),
		ClientID:         os.Getenv("KEYCLOAK_CLIENT_ID"),
		ClientSecret:     os.Getenv("KEYCLOAK_CLIENT_SECRET"),
		OAuthRedirectURL: os.Getenv("OAUTH_REDIRECT_URL"),
	}
}

func (k Keycloak) validate() error {
	var errs []error
	if k.IssuerURL == "" {
		errs = append(errs, errors.New("KEYCLOAK_ISSUER_URL is required"))
	}
	if k.ClientID == "" {
		errs = append(errs, errors.New("KEYCLOAK_CLIENT_ID is required"))
	}
	if k.ClientSecret == "" {
		errs = append(errs, errors.New("KEYCLOAK_CLIENT_SECRET is required"))
	}
	if k.OAuthRedirectURL == "" {
		errs = append(errs, errors.New("OAUTH_REDIRECT_URL is required"))
	}
	return errors.Join(errs...)
}

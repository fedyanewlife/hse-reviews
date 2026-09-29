package config

import (
	"errors"
	"os"
)

type Config struct {
	KeycloakIssuerURL    string
	KeycloakClientID     string
	KeycloakClientSecret string
	OAuthRedirectURL     string
}

func Load() (*Config, error) {
	cfg := &Config{
		KeycloakIssuerURL:    os.Getenv("KEYCLOAK_ISSUER_URL"),
		KeycloakClientID:     os.Getenv("KEYCLOAK_CLIENT_ID"),
		KeycloakClientSecret: os.Getenv("KEYCLOAK_CLIENT_SECRET"),
		OAuthRedirectURL:     os.Getenv("OAUTH_REDIRECT_URL"),
	}

	if err := cfg.validate(); err != nil {
		return nil, err
	}
	return cfg, nil
}

func (cfg Config) validate() error {
	var errs []error
	if cfg.KeycloakIssuerURL == "" {
		errs = append(errs, errors.New("KEYCLOAK_ISSUER_URL is required"))
	}
	if cfg.KeycloakClientID == "" {
		errs = append(errs, errors.New("KEYCLOAK_CLIENT_ID is required"))
	}
	if cfg.KeycloakClientSecret == "" {
		errs = append(errs, errors.New("KEYCLOAK_CLIENT_SECRET is required"))
	}
	if cfg.OAuthRedirectURL == "" {
		errs = append(errs, errors.New("OAUTH_REDIRECT_URL is required"))
	}
	return errors.Join(errs...)
}

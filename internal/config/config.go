package config

import (
	"errors"
)

type Config struct {
	DB       DB
	Keycloak Keycloak
}

func Load() (*Config, error) {
	cfg := &Config{
		DB:       loadDB(),
		Keycloak: loadKeycloak(),
	}

	if err := cfg.validate(); err != nil {
		return nil, err
	}
	return cfg, nil
}

func (cfg Config) validate() error {
	return errors.Join(
		cfg.DB.validate(),
		cfg.Keycloak.validate(),
	)
}

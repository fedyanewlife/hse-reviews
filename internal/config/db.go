package config

import (
	"errors"
	"os"
	"strconv"
)

type DB struct {
	User     string
	Password string
	Host     string
	Port     string
	Name     string
}

func loadDB() DB {
	return DB{
		User:     os.Getenv("DB_USER"),
		Password: os.Getenv("DB_PASSWORD"),
		Host:     os.Getenv("DB_HOST"),
		Port:     os.Getenv("DB_PORT"),
		Name:     os.Getenv("DB_NAME"),
	}
}

func (db DB) validate() error {
	var errs []error
	if db.Host == "" {
		errs = append(errs, errors.New("DB_HOST is required"))
	}
	if db.Port == "" {
		errs = append(errs, errors.New("DB_PORT is required"))
	} else {
		port, err := strconv.ParseUint(db.Port, 10, 16)
		if err != nil {
			errs = append(errs, errors.New("DB_PORT must be an integer between 1 and 65535"))
		} else if port == 0 {
			errs = append(errs, errors.New("DB_PORT must be between 1 and 65535"))
		}
	}
	if db.Name == "" {
		errs = append(errs, errors.New("DB_NAME is required"))
	}
	if db.User == "" {
		errs = append(errs, errors.New("DB_USER is required"))
	}
	if db.Password == "" {
		errs = append(errs, errors.New("DB_PASSWORD is required"))
	}
	return errors.Join(errs...)
}

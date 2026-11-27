-- +goose Up
CREATE TABLE reviews (
    id                    SERIAL PRIMARY KEY,
    minor_id              INTEGER     NOT NULL REFERENCES minors (id),
    user_id               INTEGER              REFERENCES users (id),
    completion_year       SMALLINT             CHECK (completion_year >= 2025),
    difficulty_rating     SMALLINT    NOT NULL CHECK (difficulty_rating BETWEEN 1 AND 5),
    workload_rating       SMALLINT    NOT NULL CHECK (workload_rating BETWEEN 1 AND 5),
    interest_rating       SMALLINT    NOT NULL CHECK (interest_rating BETWEEN 1 AND 5),
    usefulness_rating     SMALLINT    NOT NULL CHECK (usefulness_rating BETWEEN 1 AND 5),
    recommendation_rating SMALLINT    NOT NULL CHECK (recommendation_rating BETWEEN 1 AND 5),
    experience_text       TEXT                 CHECK (experience_text IS NULL OR btrim(experience_text) <> ''),
    selection_advice      TEXT                 CHECK (selection_advice IS NULL OR btrim(selection_advice) <> ''),
    status                TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected')),
    source                TEXT        NOT NULL DEFAULT 'platform' CHECK (source IN ('platform', 'prelaunch')),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at          TIMESTAMPTZ CHECK (published_at IS NULL OR published_at >= created_at),

    CHECK (status <> 'published' OR published_at IS NOT NULL),
    CHECK ((source = 'platform' AND user_id IS NOT NULL) OR
           (source = 'prelaunch' AND user_id IS NULL))
);

CREATE UNIQUE INDEX reviews_user_active_uq ON reviews (user_id) WHERE user_id IS NOT NULL AND status IN ('pending', 'published');

-- +goose Down
DROP TABLE reviews;

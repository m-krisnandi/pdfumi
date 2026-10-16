-- Magic-link login tokens + durable web sessions (dashboard auth)
CREATE TABLE login_token (
    id           UUID PRIMARY KEY,
    account_id   UUID         NOT NULL,
    token_hash   VARCHAR(128) NOT NULL,
    locale       VARCHAR(8),
    expires_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at      TIMESTAMP WITH TIME ZONE,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_login_token_account FOREIGN KEY (account_id) REFERENCES account (id)
);

CREATE UNIQUE INDEX uq_login_token_hash ON login_token (token_hash);
CREATE INDEX idx_login_token_account ON login_token (account_id);
CREATE INDEX idx_login_token_expires ON login_token (expires_at);

CREATE TABLE web_session (
    id            UUID PRIMARY KEY,
    account_id    UUID         NOT NULL,
    token_hash    VARCHAR(128) NOT NULL,
    expires_at    TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at    TIMESTAMP WITH TIME ZONE,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL,
    last_seen_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_web_session_account FOREIGN KEY (account_id) REFERENCES account (id)
);

CREATE UNIQUE INDEX uq_web_session_hash ON web_session (token_hash);
CREATE INDEX idx_web_session_account ON web_session (account_id);
CREATE INDEX idx_web_session_expires ON web_session (expires_at);

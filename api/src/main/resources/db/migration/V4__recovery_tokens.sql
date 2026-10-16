-- Magic-link tokens for API key recovery
CREATE TABLE recovery_token (
    id           UUID PRIMARY KEY,
    account_id   UUID         NOT NULL,
    token_hash   VARCHAR(128) NOT NULL,
    locale       VARCHAR(8),
    expires_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at      TIMESTAMP WITH TIME ZONE,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_recovery_token_account FOREIGN KEY (account_id) REFERENCES account (id)
);

CREATE UNIQUE INDEX uq_recovery_token_hash ON recovery_token (token_hash);
CREATE INDEX idx_recovery_token_account ON recovery_token (account_id);
CREATE INDEX idx_recovery_token_expires ON recovery_token (expires_at);

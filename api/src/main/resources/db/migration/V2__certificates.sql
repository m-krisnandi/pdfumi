-- Certificate batches and verifiable records
CREATE TABLE certificate_batch (
    id              UUID         NOT NULL PRIMARY KEY,
    event_title     VARCHAR(255) NOT NULL,
    organization    VARCHAR(255),
    event_date      VARCHAR(64),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE certificate_record (
    id              UUID         NOT NULL PRIMARY KEY,
    batch_id        UUID         NOT NULL,
    verify_code     VARCHAR(32)  NOT NULL,
    recipient_name  VARCHAR(255) NOT NULL,
    recipient_title VARCHAR(255),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_certificate_record_batch
        FOREIGN KEY (batch_id) REFERENCES certificate_batch (id)
);

CREATE UNIQUE INDEX uk_certificate_record_verify_code ON certificate_record (verify_code);
CREATE INDEX idx_certificate_record_batch ON certificate_record (batch_id);

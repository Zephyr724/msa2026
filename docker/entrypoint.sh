#!/bin/sh
set -eu

key_path="${DataProtection__KeyPath:-}"
approved_key_path="/var/lib/kiwimpact/keys"

fail() {
    echo "kiwimpact-entrypoint: $1" >&2
    exit 78
}

# Railway mounts volumes as root. The service starts this entrypoint as root
# only long enough to prepare the configured key directory, then the app and
# migration bundle run as the image's unprivileged app user.
if [ "$(id -u)" -eq 0 ]; then
    if [ "$key_path" != "$approved_key_path" ]; then
        fail "DataProtection__KeyPath must be $approved_key_path"
    fi

    if [ "${Hosting__Railway__Enabled:-false}" = "true" ] && \
       [ "${RAILWAY_VOLUME_MOUNT_PATH:-}" != "$approved_key_path" ]; then
        fail "RAILWAY_VOLUME_MOUNT_PATH must be $approved_key_path"
    fi

    mkdir -p "$approved_key_path"
    chown app:app "$approved_key_path"
    chmod 0700 "$approved_key_path"

    exec su-exec app:app "$@"
fi

exec "$@"

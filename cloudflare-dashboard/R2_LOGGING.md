# R2 runtime log archive

The Cloudflare Worker keeps D1 for structured control-plane state and important searchable events, while full runtime event batches are archived in Cloudflare R2.

## Storage split

- `LOG_ARCHIVE` / bucket `aio-v3-logs`: every received runtime event batch as NDJSON.
- D1 `v3_runtime_events`: only warnings, errors, critical events, and events whose component/event/reason indicates safety, quarantine, retreat, emergency, failure, circuit breaker, rollback, bootstrap, transaction failure, death/disconnect, content drift, target rejection, or threat.
- D1 runtime status and all existing settings/brain/control data remain unchanged.

R2 object keys are partitioned by account, character and UTC hour:

```text
logs/<account>/<character>/YYYY/MM/DD/HH/<firstAt>-<lastAt>-<batchId>.ndjson
```

The archive redacts secret-shaped fields before writing. The Worker also suppresses immediate duplicate batches within the same Worker isolate.

## Required R2 bucket

Create the private bucket once:

```bash
cd cloudflare-dashboard
npm install
npx wrangler login
npx wrangler r2 bucket create aio-v3-logs
npx wrangler r2 bucket list
```

`wrangler.jsonc` binds it as:

```jsonc
"r2_buckets": [
  {
    "binding": "LOG_ARCHIVE",
    "bucket_name": "aio-v3-logs"
  }
]
```

The bucket does not need to be public. Reads go through the authenticated Worker API.

## API

Existing bot upload endpoint:

```text
POST /api/v3/runtime
```

The R2 wrapper archives the complete event batch first and then forwards the runtime payload to the existing alpha20.22 Worker with only important events left in `status.events`.

Archive list endpoint:

```text
GET /api/v3/log-archives?account=default&character=Ranger1&limit=100
X-AIO-Read-Key: <READ_KEY>
```

Use the returned cursor for pagination.

Archive object endpoint:

```text
GET /api/v3/log-archive?account=default&key=<returned-object-key>
X-AIO-Read-Key: <READ_KEY>
```

The object response is private NDJSON.

## Failure behavior

R2 archival is fail-soft. A temporary R2 write failure does not grant any new gameplay authority and does not alter TargetSafety, Quarantine, ContentDrift, combat, merchant transactions, or local persistence. The request continues into the existing D1 worker with only important events, preventing a raw-log fallback from exhausting D1 again.

The GitHub Cloudflare deployment workflow checks whether `aio-v3-logs` exists. If the bucket has not been created yet, deployment is skipped with a notice instead of failing or provisioning storage implicitly. After creating the bucket, rerun `deploy-cloudflare` or push another Cloudflare-dashboard change.

# How PlatySync Works, Updates, and Deploys

This knowledgebase article explains how PlatySync is structured, how a workflow runs, and how to build, update, and deploy the application in a production environment.

## Audience

Use this article if you are:

- Maintaining a PlatySync instance.
- Updating PlatySync from source or from a release package.
- Deploying PlatySync as a long-running service.
- Troubleshooting where configuration, logs, uploaded files, and generated build files live.

## Short Version

PlatySync is a Node.js and TypeScript application with two main halves:

- A Fastify server that owns the API, database, scheduling, file storage, logging, and automation engine.
- A Vite/React browser interface that operators use to configure schemas, files, connectors, rules, schedules, users, settings, dictionary values, and secrets.

In development, `npm start` runs the Vite client and the watched server together.

In production, `npm run build` compiles the server and client into `build/dist`, creates a production `package.json`, creates Windows service wrapper files when `build/WinSW-x64.exe` exists, and writes a zip release package under `build`.

The production app starts with:

```powershell
node server.js
```

The Windows service wrapper in the release package uses the same command internally.

## Requirements

- Node.js `18.20.4` or newer.
- npm.
- Network access during dependency installation.
- Administrator rights if installing or controlling the Windows service.
- Access to the PlatySync data directory before updates, because that directory contains the live configuration and operational data.

## Runtime Layout

The server calculates its writable data directory at startup:

```text
PSYC_PATH, when set
otherwise %APPDATA%/platysync on Windows
otherwise ~/Library/Preferences/platysync on macOS
otherwise ~/.local/share/platysync on Linux
```

Inside that base path, PlatySync uses:

```text
db.json       Application settings, users, schemas, rules, schedules, dictionary, secrets, and sessions
storage/      Uploaded schema files, grouped by schema name
cache/        Runtime cache files
logs/         general.txt and history.txt
schemas/      Reserved schema path
```

For Windows service deployments, set `PSYC_PATH` deliberately. If the service runs as `LocalSystem`, the default `%APPDATA%` path can resolve under the system profile instead of an administrator user's profile. A fixed path such as `C:\ProgramData\PlatySync` is easier to back up, monitor, and move.

## Important Environment Variables

| Variable | Purpose |
| --- | --- |
| `PSYC_PATH` | Overrides the data directory. Recommended for production and Windows service deployments. |
| `PSYC_PORT` | Overrides the HTTP port. If unset, PlatySync uses the saved server setting or `7528`. |
| `PSYC_HOST` | Overrides the bind host. If unset, PlatySync uses the saved server setting or `0.0.0.0`. |
| `PSYC_KEY` | Overrides the encryption and cookie key. If unset, PlatySync stores a generated key in `db.json` under settings. |
| `NODE_ENV=dev` | Enables development mode. The server script sets this automatically for `npm run server`. |

Keep the same encryption key across migrations. If you use `PSYC_KEY`, keep that value with the deployment. If you do not use `PSYC_KEY`, back up `db.json`; it contains the generated key needed to decrypt saved secrets.

## How The Application Starts

Production startup runs `src/server.ts` after compilation to `server.js`.

Startup flow:

1. The process prints the active environment.
2. `InitPlatySync()` creates the Fastify server.
3. Logging is initialized under the PlatySync data directory.
4. The database is opened from `db.json` using LowDB.
5. The database version is upgraded to the current package version when needed.
6. Cookie signing and Socket.IO are registered.
7. API routes are mounted under `/api/v1`.
8. Static client files are served from the compiled `client` directory.
9. Saved schedules are initialized.
10. The server listens on `PSYC_PORT`, the saved server port, or `7528`.

The default production URL is:

```text
http://localhost:7528
```

If no users exist in `db.json`, the browser interface enters first-run setup.

## Main Concepts

### Schemas

A schema is the container for an automation workflow. It stores:

- Files uploaded for that schema.
- Connectors.
- Dictionary entries.
- Secrets.
- Rules.
- Blueprints.
- Schedules.

Schemas live in `db.json`. Uploaded files referenced by schemas live under `storage/<schema-name>/`.

### Files

Files are uploaded through the web interface and stored in the data directory. Each file gets a generated storage name and can be referenced during rule execution through the template scope:

```text
$file.<file-key-or-name>
```

### Connectors

Connectors load external or structured data into a rule run. Current server-side connector families include:

- `csv`: parses CSV data with PapaParse.
- `ldap`: connects to LDAP and searches users.
- `folder`: reads folder contents as structured rows.
- `api`: downloads iterative data from an API, with optional caching.
- `stmc`: integrates with the eduSTAR/STMC provider.

Each connector exposes headers and data rows to the automation engine.

### Rules

A rule defines the work PlatySync should evaluate or execute.

Rules can include:

- A primary connector.
- Secondary sources joined to the primary data.
- Conditions.
- Initial actions.
- Iterative actions.
- Final actions.
- Result columns for review.

The usual pattern is:

1. Evaluate the rule.
2. Review the calculated result rows.
3. Execute only the selected successful rows.

Scheduled rules use the same engine. The scheduler evaluates the rule first, collects successful primary IDs, and then executes the rule against those IDs.

### Conditions

Conditions are evaluated after templates are compiled. Supported condition families include:

- String equality and inequality.
- Contains, starts-with, ends-with, and regular expression checks.
- Numeric comparisons.
- File existence checks.
- Date comparisons.
- LDAP user, group, enabled, disabled, and OU checks.

### Actions

Actions are the operations that do work. Current action families include:

- Document actions: write PDF and print PDF.
- File actions: copy, delete, move, write CSV, and write text.
- Folder actions: copy, create, delete, and move.
- LDAP actions: create, delete, disable, enable, move OU, update account, update attributes, and update groups.
- System actions: compare, decrypt string, encrypt string, run command, template, and wait.
- Transport actions: email send and API request.
- eduSTAR/STMC actions: update student password and bulk student password update.

The Run/Command action is intentionally guarded by the `enableRun` setting. The UI does not enable it directly; it must be set manually in settings.

### Templates

PlatySync uses Handlebars-style templates to build dynamic values from the current execution scope.

Common scopes include:

- Connector records, such as `csvConnector.columnName`.
- `$file`, for uploaded file paths.
- `$path`, for data and cache paths.
- `$rule`, for rule metadata, counts, CSV/HTML summaries, and run results.
- `$iteration`, for the current primary row ID, index, and total count.

### Schedules

Schedules are attached to schemas. A schedule has triggers and tasks.

Supported trigger types:

- `cron`: runs on a CRON expression using the configured timezone or `Australia/Victoria`.
- `watch`: uses filesystem watching and runs after an optional delay when the watched path changes.

Supported task type:

- `run`: runs enabled rules, or a selected subset of rules.

Schedules can also define failure controls:

- `failAfter`: treats an execution as failed when it exceeds the configured runtime.
- `disableAfter`: disables the schedule after a configured number of failures.

## Development Workflow

Install dependencies from the repository root:

```powershell
npm install
```

Start the development server and client:

```powershell
npm start
```

This runs:

```text
npm run client
npm run server
```

Development ports:

| Process | Command | Port |
| --- | --- | --- |
| Server | `tsx watch --clear-screen=false --ignore ./build src/server.ts` | `7528` |
| Client | `vite --host` | `7529` |

Vite proxies `/api` and `/socket.io` to the server on port `7528`.

Open the development UI at:

```text
http://localhost:7529
```

Run linting before a release:

```powershell
npm run lint
```

## Build A Release

From the repository root:

```powershell
npm run lint
npm run build
```

The build command runs:

```text
tsc -p src/server
vite build
cd build
node build.js
```

Build output:

```text
build/dist/                 Production application folder
build/dist/server.js         Compiled server entry point
build/dist/index.js          Compiled Fastify app bootstrap
build/dist/client/           Compiled browser UI
build/dist/package.json      Production package file without devDependencies
build/dist/service.xml       Windows service config, when WinSW-x64.exe exists
build/dist/WinSW-x64.exe     Windows service wrapper, when present in build/
build/platysync <ver>.zip    Release package
build/build-visualizer.html  Vite bundle visualizer output
```

The release zip excludes `node_modules`. Install production dependencies on the target machine after unpacking the release.

## Fresh Production Deployment

1. Build a release or download a release package.
2. Create an application directory on the target machine, for example:

```powershell
C:\PlatySync
```

3. Extract the contents of the release zip into that application directory.
4. From the application directory, install production dependencies:

```powershell
npm install --omit=dev
```

5. Set production environment variables as needed.

Recommended for Windows service deployments:

```powershell
setx PSYC_PATH "C:\ProgramData\PlatySync" /M
setx PSYC_PORT "7528" /M
setx PSYC_HOST "0.0.0.0" /M
```

6. Start PlatySync manually for a smoke test:

```powershell
node server.js
```

7. Open:

```text
http://localhost:7528
```

8. Complete first-run setup if this is a new instance.

Stop the manual process before installing the service.

## Deploy As A Windows Service

The production package includes Windows service scripts when `WinSW-x64.exe` was available during the build.

Run these commands from the production application directory in an elevated PowerShell session:

```powershell
npm run service-install
npm run service-start
```

Useful service commands:

```powershell
npm run service-stop
npm run service-start
npm run service-uninstall
```

The generated service config uses:

```xml
<executable>node</executable>
<arguments>server.js</arguments>
<delayedAutoStart>true</delayedAutoStart>
```

Make sure `node` is available on the service account's `PATH`. If it is not, either install Node system-wide or edit `service.xml` to use the full path to `node.exe`.

The generated `service.xml` does not add environment variables. For service deployments, set environment variables system-wide before starting the service, or add environment entries to the service wrapper configuration.

## Update An Existing Deployment

Use this process for a normal in-place update.

1. Check the current application version in the web UI under Application Settings.
2. Back up the PlatySync data directory.

At minimum, preserve:

```text
db.json
storage/
cache/ if API cache state matters
https.crt and https.key, if HTTPS files are stored in the data directory
```

The safest backup is the entire `PSYC_PATH` directory.

3. Stop the running app.

For a Windows service:

```powershell
npm run service-stop
```

For a manual process, stop the terminal process running `node server.js`.

4. Build or download the new release.
5. Replace the application files with the new release files.

Do not delete the PlatySync data directory unless you intend to reset the instance.

6. Reinstall production dependencies from the new package:

```powershell
npm install --omit=dev
```

7. Confirm environment variables still point at the intended data path.
8. Start the app again.

For a Windows service:

```powershell
npm run service-start
```

For a manual process:

```powershell
node server.js
```

9. Open the UI and confirm:

- The app starts.
- The version is correct.
- Schemas, rules, schedules, files, dictionary values, and secrets are present.
- Schedules that should be enabled are enabled.
- `logs/general.txt` and `logs/history.txt` do not show startup errors.

When the new version opens `db.json`, the database version field is updated automatically to the package version.

## Roll Back

1. Stop the running app or service.
2. Restore the previous application files.
3. Restore the backed-up data directory if the newer version changed data in a way you do not want to keep.
4. Run `npm install --omit=dev` from the restored application directory if dependencies differ.
5. Start the app or service.
6. Check `logs/general.txt` and `logs/history.txt`.

Always keep the encryption key with the restored data. Secrets encrypted with one key cannot be decrypted with another.

## Move To Another Server

1. Stop PlatySync on the old server.
2. Copy the production application directory or install the same release on the new server.
3. Copy the full PlatySync data directory.
4. Recreate environment variables, especially `PSYC_PATH`, `PSYC_PORT`, `PSYC_HOST`, and `PSYC_KEY` if used.
5. Install dependencies:

```powershell
npm install --omit=dev
```

6. Start manually with `node server.js` for a smoke test.
7. Install and start the Windows service if required.

## HTTPS

In production mode, PlatySync enables HTTPS when either:

- `settings.server.https.crt` and `settings.server.https.key` point to certificate files, or
- `https.crt` and `https.key` exist in the PlatySync data directory.

Development mode does not initialize HTTPS.

After enabling HTTPS, confirm the port and host settings still match how users access the service.

## Logs

Runtime logs are written under:

```text
<PSYC_PATH>/logs/general.txt
<PSYC_PATH>/logs/history.txt
```

Use `general.txt` for startup and application errors.

Use `history.txt` for rule, schedule, and run history.

The Windows service wrapper also has its own wrapper logs in the application directory, controlled by `service.xml`.

## Common Checks After Deployment

- The server responds on the expected host and port.
- The UI loads from the production server, not the Vite development server.
- `/api/v1` responds behind the same host.
- The first-run setup does not appear unexpectedly.
- Uploaded files exist under `storage/<schema-name>/`.
- Existing secrets decrypt correctly.
- LDAP, API, CSV, and folder connectors can connect.
- Schedules initialize after startup.
- File-watch schedules point to paths the service account can read.
- The service account can read and write `PSYC_PATH`.
- The service account can access any network shares, printers, LDAP servers, proxies, or folders used by actions.

## Troubleshooting

### The UI loads but API calls fail

Confirm the production server is running on the expected port. In production, Fastify serves the static UI and API together. In development, Vite proxies API calls to port `7528`.

### PlatySync starts with an empty first-run setup

The process is probably using a different data directory. Check `PSYC_PATH` and the account running the service. On Windows services, default `%APPDATA%` can differ from the interactive administrator account.

### Secrets cannot be decrypted

The encryption key changed. Restore the original `db.json` settings key or the original `PSYC_KEY` value.

### The service installs but will not start

Check that Node is installed and available to the service account. If needed, update `service.xml` to use the full path to `node.exe`, then reinstall the service.

### Schedules do not run

Confirm the schedule is enabled, its triggers are enabled, and its task is enabled. For file-watch schedules, confirm the watched path exists and is accessible from the service account.

### Uploaded files are missing after an update

The application files were updated, but the data directory was not restored or `PSYC_PATH` changed. Restore the `storage/` folder from backup and confirm the app is using the expected data path.

## Source File Reference

Useful files for maintainers:

| File | Purpose |
| --- | --- |
| `package.json` | Development scripts, dependencies, and Node engine requirement. |
| `src/server.ts` | Production server entry point. |
| `src/index.ts` | Fastify app setup, routes, static UI serving, paths, logging, HTTPS, and environment handling. |
| `src/server/components/database.ts` | LowDB database defaults, open, sync, and version upgrade behavior. |
| `src/server/components/engine.ts` | Rule evaluation and execution engine. |
| `src/server/components/schedules.ts` | CRON and file-watch schedule runtime. |
| `src/server/components/providers.ts` | Connector registry. |
| `src/server/components/operations.ts` | Action registry. |
| `src/server/modules/cryptography.ts` | Secret encryption and key handling. |
| `vite.config.ts` | Client build output and development proxy configuration. |
| `src/server/tsconfig.json` | Server TypeScript build output configuration. |
| `build/build.js` | Production package and Windows service wrapper generation. |


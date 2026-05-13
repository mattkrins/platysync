# ❓ PlatySync

PlatySync is a web-based automation application that takes structured input data, such as a CSV file, and executes actions based on conditional logic.

It is designed for IT administrators, school technicians, and operations teams who need repeatable workflows for directory updates, onboarding documents, scheduled maintenance, file operations, and other practical admin jobs.

> Build rules once, test them safely, and run them manually, on a schedule, or when a watched file changes.

## 💪 Features

Some of the features PlatySync provides are:

- 💉 **CSV to LDAP**: Automate management of your user directory from a CSV source of truth.
- 🤗 **Onboarding**: Generate and print onboarding PDF documents from templates.
- 📂 **Bulk Actions**: Perform bulk file and folder operations, such as renaming files from a naming convention.
- 🛠️ **Template System**: Build dynamic values with a string template system and scope explorer.
- ⏰ **Schedules**: Execute automation rules on a CRON schedule or by monitoring a specific file.
- 🔎 **Evaluate Before Run**: Preview matching rows and calculated actions before applying real changes.
- 🔐 **Secrets and Dictionary Values**: Store reusable values for rules, connectors, and templates.
- 🧾 **Run History and Logs**: Track rule execution, schedule activity, warnings, and errors.
- 🎩 **Windows Service Support**: Deploy PlatySync as a long-running background service.

## 🧠 Why PlatySync Exists

Many administration workflows are repetitive but risky when handled by hand:

- Export a CSV from a student information system.
- Compare the rows against LDAP.
- Update users, groups, or attributes.
- Generate account sheets or welcome documents.
- Rename or move files.
- Repeat the whole process next week.

PlatySync turns those jobs into reusable schemas, connectors, rules, templates, actions, and schedules. The result is a practical automation tool that avoids writing a one-off script for every new workflow.

## 🔄 How It Works

At a high level:

```text
CSV / files / LDAP / APIs / folders
        |
        v
Schema configuration
        |
        v
Connectors load structured data
        |
        v
Rules join data, compile templates, and evaluate conditions
        |
        v
Actions run for matching rows
        |
        v
LDAP / files / PDFs / email / APIs / logs
```

PlatySync has two main parts:

- **Server runtime**: A Fastify server that owns the API, database, logging, scheduling, file storage, Socket.IO status updates, and automation engine.
- **Browser interface**: A Vite/React client for managing schemas, rules, connectors, files, schedules, users, settings, dictionary values, and secrets.

Rules can have:

- **Initial actions** that run before row processing.
- **Iterative actions** that run once for each matching primary row.
- **Final actions** that run after row processing and can use summary output.

For a deeper operational explanation, see [How PlatySync Works, Updates, and Deploys](docs/knowledgebase/how-platysync-works-update-deploy.md).

## 🧩 Example Use Cases

- **Student account lifecycle management**: Update LDAP users, groups, and attributes from a school export.
- **Staff onboarding**: Generate repeatable onboarding PDFs containing account details and setup instructions.
- **Scheduled directory maintenance**: Run a rule set every morning from a refreshed CSV source.
- **File naming standardisation**: Rename or move files in bulk using values generated from structured data.
- **Repeatable operations workflows**: Convert common manual jobs into reusable, testable automation rules.

## 🛠️ Tech Stack

- Node.js
- TypeScript
- Fastify
- React
- Vite
- Mantine
- LowDB
- Socket.IO
- Croner
- Handlebars
- ldapjs

## 📋 Requirements

- Node.js `18.20.4` or newer.
- npm.
- Windows, macOS, or Linux for development.
- Administrator rights on Windows when installing or controlling the service wrapper.

## 🚀 Development

Install dependencies:

```powershell
npm install
```

Start the development server and client:

```powershell
npm start
```

This runs both:

```powershell
npm run server
npm run client
```

Development ports:

| Process | Port | Notes |
| --- | --- | --- |
| Fastify server | `7528` | API and Socket.IO server |
| Vite client | `7529` | Proxies `/api` and `/socket.io` to port `7528` |

Open the development UI at:

```text
http://localhost:7529
```

Run linting:

```powershell
npm run lint
```

## 📦 Build

Create a production build:

```powershell
npm run build
```

The build compiles the server and client into:

```text
build/dist/
```

It also creates a release zip under `build/`.

When `build/WinSW-x64.exe` is present, the build output includes Windows service wrapper files and service npm scripts.

## 🖥️ Production Run

From a production build or extracted release package:

```powershell
npm install --omit=dev
node server.js
```

The default production URL is:

```text
http://localhost:7528
```

## 🪟 Windows Service

When the release package includes the generated service files, run these commands from the production application directory in an elevated PowerShell session:

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

The service wrapper runs:

```powershell
node server.js
```

Make sure Node is available on the service account's `PATH`.

## 💾 Runtime Data

PlatySync stores runtime data outside the application build. By default, it uses:

```text
PSYC_PATH, when set
otherwise %APPDATA%/platysync on Windows
otherwise ~/Library/Preferences/platysync on macOS
otherwise ~/.local/share/platysync on Linux
```

Important runtime files and folders:

```text
db.json       Settings, users, schemas, rules, schedules, dictionary, secrets, and sessions
storage/      Uploaded schema files
cache/        Runtime cache files
logs/         general.txt and history.txt
```

For production and Windows service deployments, set `PSYC_PATH` deliberately. A fixed path such as `C:\ProgramData\PlatySync` is easier to back up and avoids surprises when a service runs under a different account.

Useful environment variables:

| Variable | Purpose |
| --- | --- |
| `PSYC_PATH` | Overrides the runtime data directory. |
| `PSYC_PORT` | Overrides the HTTP port. Defaults to saved settings or `7528`. |
| `PSYC_HOST` | Overrides the bind host. Defaults to saved settings or `0.0.0.0`. |
| `PSYC_KEY` | Overrides the encryption and cookie key. |

Back up the full runtime data directory before updates. Keep the encryption key with the deployment, because saved secrets cannot be decrypted with a different key.

## 🔁 Updating

For an existing deployment:

1. Back up the full `PSYC_PATH` directory.
2. Stop PlatySync or the Windows service.
3. Replace the application files with the new release.
4. Run `npm install --omit=dev` in the production application directory.
5. Confirm environment variables still point to the intended runtime data path.
6. Start PlatySync again.
7. Confirm the UI loads, schemas are present, schedules are enabled as expected, and logs do not show startup errors.

Detailed update, rollback, migration, HTTPS, and troubleshooting guidance is available in [the knowledgebase article](docs/knowledgebase/how-platysync-works-update-deploy.md).

## 🗂️ Project Structure

```text
src/client/                 React browser application
src/server.ts               Server entry point
src/index.ts                Fastify setup, routes, logging, paths, HTTPS, static client serving
src/server/components/      Database, engine, schedules, providers, operations
src/server/modules/         Shared server modules
src/server/routes/          API routes
src/typings/                Shared TypeScript declarations
build/build.js              Production packaging and Windows service wrapper generation
docs/knowledgebase/         Operational documentation
```

## ⚠️ AI Disclosure

AI assistance has only been used to create documentation for this repository. It has not been used to create the application source code or product functionality.

## 📄 License

PlatySync is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International Public License.

See [LICENSE.txt](LICENSE.txt) for the full license text.

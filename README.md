# BHT Schedule Lab

Локальное приложение для анализа расписания Medieninformatik B.Sc. за Wintersemester 2026/27.

```bash
cd "/Users/damirahavaashova/Desktop/3 semester/bht-schedule"
npm ci
npm run setup:python
npm run import
npm run dev
```

Python-зависимости устанавливаются в локальную папку `.venv`; отдельная активация окружения для `npm run import` не требуется. Для запуска с готовыми данными достаточно `npm run dev`.

Файлы-источники хранятся вне приложения, в учебных папках:

- `../plan/source-exports/01-schedule.mhtml`–`05-schedule.mhtml` — исходные выгрузки расписания.
- `../plan/module-handbook.pdf` — справочник модулей.
- `../plan/source-extracts/module-handbook.txt` — извлечённый текст для импорта.
- `../web-engineering-2/track-2/01-lectures/` — PDF и план учебных недель Web Engineering II.
- `../project/groups.xlsx` — исходная таблица проектных групп; приложение показывает агрегированные данные.
- `source-extracts/` внутри соответствующего предмета и потока — ранее извлечённые тексты и изображения.

Импорт читает выгрузки и извлечённый текст из `../plan/source-exports/` и `../plan/source-extracts/`, затем создаёт `public/data/schedule.json` и `public/data/extraction-report.json`. Сохраняйте приложение рядом с учебными папками для повторного импорта. Для работы интерфейса достаточно готовых данных из `public/data/`.

Если извлечённый текст отсутствует, подготовьте его с помощью установленного `pdftotext` (Poppler):

```bash
mkdir -p "../plan/source-extracts"
pdftotext -layout "../plan/module-handbook.pdf" "../plan/source-extracts/module-handbook.txt"
```

Проверка критической логики: `npm test`. Производственная сборка: `npm run build`.

## Email data import

`../plan/source-extracts/email-course-facts-2026-10-08.json` contains supporting
course excerpts identified by mailbox, UIDVALIDITY, UID, date and subject.
`../plan/source-extracts/email-import-2026-10-08.json` contains curated facts with
explicit track scope, uncertainty, tasks, exam confirmations and personal planning.
Recognition PDFs remain in `../plan/source-exports/recognition/`.

Run `npm run import`, then `npm run build:course-db` to reproduce all five data files:
schedule, course database, extraction report, homework and personal planning.
The additional WE2 exercise has a null official group number and date range because
the announcement does not specify them. One-day and tentative changes remain notes.
Existing exam IDs and values are preserved; eight email notifications confirm them.

Homework imports appear in the interface. User edits, submission flags and deletions
remain in local browser storage and take precedence over imported task defaults.
Unknown tracks and deadlines are shown explicitly. Submission confirmation does not
mean acceptance or a passing grade.

`personal-planning.json` stores the interview, mobility guidance and recognition
snapshot separately from shared course rules. Recognition grades are documented
values dated 2026-09-07, not a claim about current Polli values; later adjustments
remain flagged. Credentials, birth dates and participant lists are not included.

## Interface and preferences

The English interface has Timetable, Assignments, Exams and Modules tabs.
Modules and cohorts are selected independently; shared and unknown cohorts remain
visible. Additional group, session, assessment and instructor filters and schedule
preferences are under a disclosure panel. Finding options never selects one;
changing a filter clears the selected option. Search prunes conflicts and retains
up to 5,000 partial combinations per module to keep the interface responsive.
The timetable shows all simultaneous groups in compact daily rows.
Week navigation checks each session's actual weekday against its source date range.
A missing boundary remains unknown; no holiday exceptions are inferred.

`bht-filters` in browser storage preserves module/cohort filters, other settings,
current week and tab. Legacy global cohort settings migrate; obsolete IDs are
removed. A chosen schedule option is intentionally not restored automatically.
`bht-homework` stores task overrides and personal tasks; `bht-homework-hidden`
stores deletion IDs. Import defaults never override these values. Keep the same
site origin to retain browser data. There is no cross-device task synchronization.

## Existing server deployment

Current URL: https://bht-schedule.152.53.101.9.nip.io/
Server: `root@152.53.101.9`, using the existing SSH configuration.
Caddy forwards this hostname to `bht-schedule-site:80`. The existing
`nginx:1.27-alpine` container reads `/opt/bht-schedule/site` through a read-only
bind mount at `/usr/share/nginx/html`. Deployment updates static files directly;
no Git push, container rebuild or new infrastructure is required.

Run `scripts/deploy.sh` only when deployment is explicitly authorized. It tests
and builds, snapshots the existing site in a dated server release directory,
stages the build and saves a source archive there. Existing assets and unknown
server files are retained. Data files are replaced individually, and the new
index is installed last by atomic rename. The script verifies the live HTML.
Check the four screens in the browser after deployment as well.

For rollback, use the exact release ID printed by the script:

```bash
ssh root@152.53.101.9 'cp -a /opt/bht-schedule/releases/RELEASE_ID/before/. /opt/bht-schedule/site/'
```

This restores the previous files without removing later assets or touching
browser-local task overrides. Source archives and rollback snapshots stay
outside the served directory. Do not delete them as part of deployment.

## Mensa menu

The Mensa tab fetches BHT Luxemburger Straße (OpenMensa ID `2027`) on demand.
It shares the timetable week, supports date navigation and student/employee/guest
prices, and retains source dish names and dietary/allergen notes. Course filters
do not filter meals. Responses are cached in memory for five minutes; missing
menus, explicitly closed days and network failures are shown separately.
No credentials, server changes or generated course database updates are needed.
OpenMensa allows browser requests (CORS). Menus depend on third-party availability;
the official menu is always linked. Retrieval time is not the provider update time.

API documentation: https://docs.openmensa.org/api/v2/overview/
Days: https://docs.openmensa.org/api/v2/days/
Meals: https://docs.openmensa.org/api/v2/meals/
Official source: https://www.stw.berlin/mensen/einrichtungen/berliner-hochschule-f%C3%BCr-technik/mensa-bht.html

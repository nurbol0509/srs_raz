# REST API анықтамасы

Base URL: http://localhost:3000. POST/PUT: `Content-Type: application/json`.
PUT толық жаңартады: барлық кіріс өрістерін жіберіңіз. id және created_at серверде жасалады.

| Әдіс | URL | Мақсаты | Сәтті статус |
|---|---|---|---|
| GET | `/api/teachers` | Тізім | 200 |
| GET | `/api/teachers/:id` | Бір жазба | 200 |
| POST | `/api/teachers` | Қосу | 201 |
| PUT | `/api/teachers/:id` | Толық жаңарту | 200 |
| DELETE | `/api/teachers/:id` | Жою | 200 |
| GET | `/api/students` | Тізім | 200 |
| GET | `/api/students/:id` | Бір жазба | 200 |
| POST | `/api/students` | Қосу | 201 |
| PUT | `/api/students/:id` | Толық жаңарту | 200 |
| DELETE | `/api/students/:id` | Жою | 200 |
| GET | `/api/courses` | Тізім | 200 |
| GET | `/api/courses/:id` | Бір жазба | 200 |
| POST | `/api/courses` | Қосу | 201 |
| PUT | `/api/courses/:id` | Толық жаңарту | 200 |
| DELETE | `/api/courses/:id` | Жою | 200 |
| GET | `/api/lessons` | Тізім | 200 |
| GET | `/api/lessons/:id` | Бір жазба | 200 |
| POST | `/api/lessons` | Қосу | 201 |
| PUT | `/api/lessons/:id` | Толық жаңарту | 200 |
| DELETE | `/api/lessons/:id` | Жою | 200 |
| GET | `/api/enrollments` | Тізім | 200 |
| GET | `/api/enrollments/:id` | Бір жазба | 200 |
| POST | `/api/enrollments` | Қосу | 201 |
| PUT | `/api/enrollments/:id` | Толық жаңарту | 200 |
| DELETE | `/api/enrollments/:id` | Жою | 200 |
| GET | `/api/progress` | Тізім | 200 |
| GET | `/api/progress/:id` | Бір жазба | 200 |
| POST | `/api/progress` | Қосу | 201 |
| PUT | `/api/progress/:id` | Толық жаңарту | 200 |
| DELETE | `/api/progress/:id` | Жою | 200 |
| GET | `/api/courses/export.xml` | Курстар XML форматында | 200 |
| GET | `/api/enrollments/:id/summary` | Орындалған сабақ саны және пайыз | 200 |

## JSON мысалы

```bash
curl -i http://localhost:3000/api/courses \
  -H 'Content-Type: application/json' \
  -d '{"title":"JavaScript курсы","slug":"javascript-course","description":"Негіздер мен тәжірибе","teacher_id":1,"category":"Бағдарламалау","level":"beginner","price":10000,"duration_hours":20,"status":"published"}'
```

201 Created және Location тақырыбы қайтады. Жауапта енгізілген өрістермен бірге id және created_at болады. `price` — теңгемен бүтін сан; нақты төлем алынбайды.

Іздеу: `GET /api/courses?q=Node&status=published`; қосымша category, level, teacher_id сүзгілері бар. Lesson үшін course_id, Enrollment үшін student_id/course_id, Progress үшін enrollment_id/lesson_id сүзгілері қолданылады.

## Қателер

400 — міндетті өріс жоқ, тип/формат қате, белгісіз өріс, жарамсыз JSON немесе бизнес ереже бұзылған.
404 — жазба/маршрут жоқ. 405 — рұқсат етілмеген HTTP әдіс.
409 — UNIQUE немесе сыртқы кілт шектеуі. 413 — сұрау денесі 100 KB-тан үлкен.
415 — POST/PUT үшін JSON Content-Type жоқ. 500 — сервердің күтпеген қатесі.

Қате пішімі: `{"error":{"code":"...","message":"..."}}`.

Нақты кіріс схемалары мен жауап сипаттамасы `openapi.json` ішінде. Орындалған сұраулар `postman-results.json` ішінде сақталған.

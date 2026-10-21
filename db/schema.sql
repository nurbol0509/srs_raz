PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL) STRICT;
CREATE TABLE IF NOT EXISTS teachers (
 id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL CHECK(length(trim(name))>=2),
 email TEXT NOT NULL UNIQUE COLLATE NOCASE, specialty TEXT NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS students (
 id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL CHECK(length(trim(name))>=2),
 email TEXT NOT NULL UNIQUE COLLATE NOCASE
) STRICT;
CREATE TABLE IF NOT EXISTS student_profiles (
 student_id INTEGER PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
 bio TEXT NOT NULL DEFAULT '', joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
) STRICT;
CREATE TABLE IF NOT EXISTS courses (
 id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL CHECK(length(trim(title))>=3),
 slug TEXT NOT NULL UNIQUE, description TEXT NOT NULL, teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
 category TEXT NOT NULL, level TEXT NOT NULL CHECK(level IN ('beginner','intermediate','advanced')),
 price INTEGER NOT NULL CHECK(price>=0), duration_hours INTEGER NOT NULL CHECK(duration_hours>0),
 status TEXT NOT NULL CHECK(status IN ('draft','published','archived')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
) STRICT;
CREATE TABLE IF NOT EXISTS lessons (
 id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
 title TEXT NOT NULL, content TEXT NOT NULL, position INTEGER NOT NULL CHECK(position>0),
 duration_minutes INTEGER NOT NULL CHECK(duration_minutes>0), UNIQUE(course_id,position)
) STRICT;
CREATE TABLE IF NOT EXISTS enrollments (
 id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
 course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
 status TEXT NOT NULL CHECK(status IN ('active','cancelled')), enrolled_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(student_id,course_id)
) STRICT;
CREATE TABLE IF NOT EXISTS progress (
 id INTEGER PRIMARY KEY AUTOINCREMENT, enrollment_id INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
 lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
 completed INTEGER NOT NULL CHECK(completed IN (0,1)), updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(enrollment_id,lesson_id)
) STRICT;
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_courses_teacher ON courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);

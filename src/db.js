const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');
function openDatabase(filename) {
  if (filename !== ':memory:') fs.mkdirSync(path.dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
  db.exec(fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8'));
  if (!db.prepare("SELECT value FROM metadata WHERE key='seeded'").get()) {
    db.exec('BEGIN');
    try {
      const teacher = db.prepare('INSERT INTO teachers(name,email,specialty) VALUES(?,?,?)');
      teacher.run('Айдана Серік','aidana@example.com','Веб бағдарламалау');
      teacher.run('Ерлан Омар','erlan@example.com','Деректерді талдау');
      const student = db.prepare('INSERT INTO students(name,email) VALUES(?,?)');
      student.run('Әли Нұрлан','ali@example.com'); student.run('Аружан Әсет','aruzhan@example.com');
      db.exec('INSERT INTO student_profiles(student_id) SELECT id FROM students');
      const course = db.prepare('INSERT INTO courses(title,slug,description,teacher_id,category,level,price,duration_hours,status) VALUES(?,?,?,?,?,?,?,?,?)');
      course.run('Node.js және REST API','node-rest','HTTP сұраныстарынан деректер қорына дейін: Express арқылы толық веб-қызмет құрыңыз.',1,'Бағдарламалау','beginner',15000,24,'published');
      course.run('Python арқылы деректерді талдау','python-data','Кестелерді тазалау, талдау және нәтижелерді визуализациялау негіздері.',2,'Деректер','intermediate',20000,32,'published');
      course.run('Веб интерфейс негіздері','web-ui','HTML, CSS және JavaScript көмегімен қолжетімді интерфейс жасау.',1,'Дизайн','beginner',0,16,'draft');
      const lesson = db.prepare('INSERT INTO lessons(course_id,title,content,position,duration_minutes) VALUES(?,?,?,?,?)');
      lesson.run(1,'HTTP және клиент–сервер','Клиент сұраныс жібереді, сервер статус, тақырыптар және жауап денесін қайтарады.',1,30);
      lesson.run(1,'Express маршруттары','app.get, app.post, app.put және app.delete арқылы ресурстардың маршруттарын анықтаймыз.',2,40);
      lesson.run(1,'SQLite және CRUD','SQL сұраныстарындағы параметрлер деректерді кодтан бөлуге мүмкіндік береді.',3,45);
      lesson.run(2,'Деректерді дайындау','Бос мәндер мен қайталанатын жазбаларды анықтау.',1,35);
      lesson.run(2,'Талдау және графиктер','Топтау, орташа мәндер және графиктер.',2,40);
      db.exec("INSERT INTO enrollments(student_id,course_id,status) VALUES(1,1,'active'); INSERT INTO progress(enrollment_id,lesson_id,completed) VALUES(1,1,1); INSERT INTO metadata VALUES('seeded','1'); COMMIT;");
    } catch(error) { db.exec('ROLLBACK'); throw error; }
  }
  return db;
}
module.exports = { openDatabase };

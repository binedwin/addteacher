var http = require('http');
var url = require('url')
var qs = require('querystring');
var db = require('./lib/db');
var template = require('./lib/template');
const express = require('express');
const ejs = require('ejs');
// const session = require('express-session');
const bodyParser = require('body-parser');
// const FileStore = require('session-file-store')(session);


const app = express();
const port = 8080;
app.set('view engine', 'ejs'); // EJS를 템플릿 엔진으로 사용
app.use(express.static('public')); //  정적 파일 서비스 미들웨어를 설정하는 부분 (예, css)
app.use(bodyParser.urlencoded({ extended: true })); // body-parser 설정

app.get('/', function(req, res, next){
	console.log('home으로 이동');
	res.render('home');
});

/* 태전관 */
app.get('/tj', function(req, res) {
	console.log('태전관으로 이동');
    var title = '태전관';
    var cr_eng = 'tj';
	var arr = [];

    db.query(`SELECT * FROM week;`, function(err1, weeks) {
        if (err1) { throw err1; }
		db.query(`SELECT * FROM classroom WHERE cr_eng = '${cr_eng}' ORDER BY cr_classroom ASC;`, function(err2, classrooms) {
            if (err2) { throw err2; }
			db.query(`SELECT * FROM teach;`, function(err3, teachs) {
				if (err3) { throw err3; }

				for (let index = 0; index < weeks.length; index++) {
					db.query(`SELECT le.* FROM lesson AS le JOIN classroom AS cr ON le.l_building = cr.cr_building WHERE cr.cr_eng = '${cr_eng}' AND le.l_week = '${weeks[index].w_eng}' GROUP BY le.l_id;`, function(err4, lessons) {
						if (err4) { throw err4; }
						arr[index] = template.onetable(weeks[index].w_eng, weeks[index].w_ko, classrooms, teachs, lessons);
						if(index == weeks.length - 1){
							res.render('time/tj', { weeks: arr });
						}
					});
				}
			});
		});
    });
});

/* 역동관(본관) */
app.get('/ydm', function(req, res) {
	console.log('역동관(본관)으로 이동');
    var title = '역동관(본관)';
    var cr_eng = 'ydm';

    db.query(`SELECT * FROM week;`, function(err1, weeks) {
        if (err1) { throw err1; }
		db.query(`SELECT * FROM classroom WHERE cr_eng = '${cr_eng}' ORDER BY cr_classroom ASC;`, function(err2, classrooms) {
            if (err2) { throw err2; }
			db.query(`SELECT t.* FROM teach AS t JOIN lesson AS le ON t.t_teacher = le.l_teacher WHERE le.l_building = '${title}';`, function(err3, teachs) {
				if (err3) { throw err3; }
				db.query(`SELECT * FROM lesson WHERE l_building = '${title}';`, function(err4, lessons) {
					if (err4) { throw err4; }
					db.query(`SELECT le.* FROM lesson AS le JOIN classroom AS cr ON le.l_building = cr.cr_building WHERE cr.cr_eng = '${cr_eng}' GROUP BY le.l_id;`, function(error, times) {
						if (error) { throw error; }
						res.render('time/ydm', { weeks: weeks,  classrooms: classrooms, teachs: teachs, lessons: lessons, times: times });
					});
				});
			});
		});
    });
});

/* 역동관(1관) */

/* 역동관(3관) */

/* ----------------------------------------------------------- */

/* 1. 검색하기 */
app.get('/search_process', function(req, res){
	var searchQuery = req.query;
	var building_eng = searchQuery.building_eng;
	var building_ko = searchQuery.building_ko;
	var searchInput = searchQuery.searchInput;

	//console.log(building_eng);
	//console.log(building_ko);
	//console.log(searchInput);

	db.query(`SELECT * FROM week;`, function(err1, weeks) {
        if (err1) { throw err1; }
		db.query(`SELECT * FROM classroom WHERE cr_eng = '${building_eng}' ORDER BY cr_classroom ASC;`, function(err2, classrooms) {
            if (err2) { throw err2; }
			db.query(`SELECT t.* FROM teach AS t JOIN lesson AS le ON t.t_teacher = le.l_teacher WHERE le.l_building = '${building_ko}';`, function(err3, teachs) {
				if (err3) { throw err3; }
				db.query(`SELECT * FROM lesson WHERE l_building = '${building_ko}';`, function(err4, lessons) {
					if (err4) { throw err4; }
					var searchSQL = `SELECT le.* FROM lesson AS le JOIN classroom AS cr ON le.l_building = cr.cr_building WHERE cr.cr_eng = '${building_eng}' AND CONCAT_WS(" ", le.l_teacher, le.l_grade, le.l_subject) LIKE '%${searchInput}%' GROUP BY le.l_id;`;
					db.query(searchSQL, function(err4, searchResults) {
						if (err4) { throw err4; }
						// console.log(searchSQL);
						// console.log(searchResults);
						var templateName = building_eng.toLowerCase();
						res.render(`time/${templateName}`, { weeks: weeks, classrooms: classrooms, teachs: teachs, lessons: lessons, times: searchResults });
					});
				});
			});
		});
    });
});

/*  2. 카테고리별로 보기 - 요일 */
app.get('/category_week', function(req, res){
	var categoryQuery = req.query;
	var building_eng = categoryQuery.building_eng;
	var building_ko = categoryQuery.building_ko;
	var categoryInput = Array.isArray(categoryQuery.week) ? categoryQuery.week : [categoryQuery.week];

	//console.log(building_eng);
	//console.log(building_ko);
	//console.log(categoryInput);

	db.query(`SELECT * FROM week;`, function(err1, weeks) {
        if (err1) { throw err1; }
		db.query(`SELECT * FROM classroom WHERE cr_eng = '${building_eng}' ORDER BY cr_classroom ASC;`, function(err2, classrooms) {
            if (err2) { throw err2; }
			db.query(`SELECT t.* FROM teach AS t JOIN lesson AS le ON t.t_teacher = le.l_teacher WHERE le.l_building = '${building_ko}';`, function(err3, teachs) {
				if (err3) { throw err3; }
				db.query(`SELECT * FROM lesson WHERE l_building = '${building_ko}';`, function(err4, lessons) {
					if (err4) { throw err4; }
					var categoryConditions = categoryInput.map(input => `le.l_week LIKE '%${input}%'`).join(' OR '); 
					var categorySQL = `SELECT le.* FROM lesson AS le JOIN classroom AS cr ON le.l_building = cr.cr_building WHERE cr.cr_eng = '${building_eng}' AND (${categoryConditions}) GROUP BY le.l_id;`;
					db.query(categorySQL, function(err4, categoryResults) {
						if (err4) { throw err4; }
						var templateName = building_eng.toLowerCase();
						res.render(`time/${templateName}`, { weeks: weeks, classrooms: classrooms, teachs: teachs, lessons: lessons, times: categoryResults });
					});
				});
			});
		});
    });
});

/*  2. 카테고리별로 보기 - 강의실 */
app.get('/category_classroom', function(req, res){
	var categoryQuery = req.query;
	var building_eng = categoryQuery.building_eng;
	var building_ko = categoryQuery.building_ko;
	var categoryInput = Array.isArray(categoryQuery.classroom) ? categoryQuery.classroom.map(Number) : [Number(categoryQuery.classroom)];

	//console.log(building_eng);
	//console.log(building_ko);
	//console.log(categoryInput);

	db.query(`SELECT * FROM week;`, function(err1, weeks) {
        if (err1) { throw err1; }
		db.query(`SELECT * FROM classroom WHERE cr_eng = '${building_eng}' ORDER BY cr_classroom ASC;`, function(err2, classrooms) {
            if (err2) { throw err2; }
			db.query(`SELECT t.* FROM teach AS t JOIN lesson AS le ON t.t_teacher = le.l_teacher WHERE le.l_building = '${building_ko}';`, function(err3, teachs) {
				if (err3) { throw err3; }
				db.query(`SELECT * FROM lesson WHERE l_building = '${building_ko}';`, function(err4, lessons) {
					if (err4) { throw err4; }
					var categoryConditions = categoryInput.map(input => `cr.cr_cnt = ${input}`).join(' OR ');
					var categorySQL = `SELECT le.* FROM lesson AS le JOIN classroom AS cr ON le.l_building = cr.cr_building AND le.l_classroom = cr.cr_classroom WHERE cr.cr_eng = '${building_eng}' AND (${categoryConditions}) GROUP BY le.l_id;`;
					db.query(categorySQL, function(err4, categoryResults) {
						if (err4) { throw err4; }
						var templateName = building_eng.toLowerCase();
						res.render(`time/${templateName}`, { weeks: weeks, classrooms: classrooms, teachs: teachs, lessons: lessons, times: categoryResults });
					});
				});
			});
		});
    });
});

/*  2. 카테고리별로 보기 - 강사 */
app.get('/category_teacher', function(req, res){
	var categoryQuery = req.query;
	var building_eng = categoryQuery.building_eng;
	var building_ko = categoryQuery.building_ko;
	var categoryInput = Array.isArray(categoryQuery.teacher) ? categoryQuery.teacher.map(Number) : [Number(categoryQuery.teacher)];

	//console.log(building_eng);
	//console.log(building_ko);
	//console.log(categoryInput);

	db.query(`SELECT * FROM week;`, function(err1, weeks) {
        if (err1) { throw err1; }
		db.query(`SELECT * FROM classroom WHERE cr_eng = '${building_eng}' ORDER BY cr_classroom ASC;`, function(err2, classrooms) {
            if (err2) { throw err2; }
			db.query(`SELECT t.* FROM teach AS t JOIN lesson AS le ON t.t_teacher = le.l_teacher WHERE le.l_building = '${building_ko}';`, function(err3, teachs) {
				if (err3) { throw err3; }
				db.query(`SELECT * FROM lesson WHERE l_building = '${building_ko}';`, function(err4, lessons) {
					if (err4) { throw err4; }
					var categoryConditions = categoryInput.map(input => `t.t_id = ${input}`).join(' OR ');
					var categorySQL = `SELECT le.* FROM lesson AS le JOIN classroom AS cr ON le.l_building = cr.cr_building JOIN teach AS t ON le.l_teacher = t.t_teacher WHERE cr.cr_eng = '${building_eng}' AND (${categoryConditions}) GROUP BY le.l_id;`;
					db.query(categorySQL, function(err4, categoryResults) {
						if (err4) { throw err4; }
						var templateName = building_eng.toLowerCase();
						res.render(`time/${templateName}`, { weeks: weeks, classrooms: classrooms, teachs: teachs, lessons: lessons, times: categoryResults });
					});
				});
			});
		});
    });
});

/*  2. 카테고리별로 보기 - 학년 */
app.get('/category_grade', function(req, res){
	var categoryQuery = req.query;
	var building_eng = categoryQuery.building_eng;
	var building_ko = categoryQuery.building_ko;
	var categoryInput = Array.isArray(categoryQuery.grade) ? categoryQuery.grade : [categoryQuery.grade];

	//console.log(building_eng);
	//console.log(building_ko);
	//console.log(categoryInput);

	db.query(`SELECT * FROM week;`, function(err1, weeks) {
        if (err1) { throw err1; }
		db.query(`SELECT * FROM classroom WHERE cr_eng = '${building_eng}' ORDER BY cr_classroom ASC;`, function(err2, classrooms) {
            if (err2) { throw err2; }
			db.query(`SELECT t.* FROM teach AS t JOIN lesson AS le ON t.t_teacher = le.l_teacher WHERE le.l_building = '${building_ko}';`, function(err3, teachs) {
				if (err3) { throw err3; }
				db.query(`SELECT * FROM lesson WHERE l_building = '${building_ko}';`, function(err4, lessons) {
					if (err4) { throw err4; }
					var categoryConditions = categoryInput.map(input => `l_grade LIKE '%${input}%'`).join(' OR ');
					var categorySQL = `SELECT le.* FROM lesson AS le JOIN classroom AS cr ON le.l_building = cr.cr_building WHERE cr.cr_eng = '${building_eng}' AND (${categoryConditions}) GROUP BY le.l_id;`;
					db.query(categorySQL, function(err4, categoryResults) {
						if (err4) { throw err4; }
						var templateName = building_eng.toLowerCase();
						res.render(`time/${templateName}`, { weeks: weeks, classrooms: classrooms, teachs: teachs, lessons: lessons, times: categoryResults });
					});
				});
			});
		});
    });
});

/*  2. 카테고리별로 보기 - 과목 */
app.get('/category_subject', function(req, res){
	var categoryQuery = req.query;
	var building_eng = categoryQuery.building_eng;
	var building_ko = categoryQuery.building_ko;
	var categoryInput = Array.isArray(categoryQuery.subject) ? categoryQuery.subject : [categoryQuery.subject];

	//console.log(building_eng);
	//console.log(building_ko);
	//console.log(categoryInput);

	db.query(`SELECT * FROM week;`, function(err1, weeks) {
        if (err1) { throw err1; }
		db.query(`SELECT * FROM classroom WHERE cr_eng = '${building_eng}' ORDER BY cr_classroom ASC;`, function(err2, classrooms) {
            if (err2) { throw err2; }
			db.query(`SELECT t.* FROM teach AS t JOIN lesson AS le ON t.t_teacher = le.l_teacher WHERE le.l_building = '${building_ko}';`, function(err3, teachs) {
				if (err3) { throw err3; }
				db.query(`SELECT * FROM lesson WHERE l_building = '${building_ko}';`, function(err4, lessons) {
					if (err4) { throw err4; }
					var categoryConditions = categoryInput.map(input => `l_subject LIKE '%${input}%'`).join(' OR ');
					var categorySQL = `SELECT le.* FROM lesson AS le JOIN classroom AS cr ON le.l_building = cr.cr_building WHERE cr.cr_eng = '${building_eng}' AND (${categoryConditions}) GROUP BY le.l_id;`;
					db.query(categorySQL, function(err4, categoryResults) {
						if (err4) { throw err4; }
						var templateName = building_eng.toLowerCase();
						res.render(`time/${templateName}`, { weeks: weeks, classrooms: classrooms, teachs: teachs, lessons: lessons, times: categoryResults });
					});
				});
			});
		});
    });
});

/*  3. 강의실 관리 - 추가 */
app.post('/classroom_add_process', function(req, res){
	var building_eng = req.body.building_eng;
	var building_ko = req.body.building_ko;
	var classroomInput = req.body.classroomInput;

	console.log(building_eng);
	console.log(building_ko);
	console.log(classroomInput);

	const sql = 'INSERT INTO classroom (cr_eng, cr_building, cr_classroom) VALUES (?, ?, ?)';
	db.query(sql, [building_eng, building_ko, classroomInput], function(err, result){
		if (err) {
			console.error('강의실 추가 실패: ' + err.message);
			res.status(500).send('강의실 추가 실패');
			return;
		}
	  
		console.log('강의실 추가 성공');

		db.query(`SELECT * FROM week;`, function(err1, weeks) {
			if (err1) { throw err1; }
			db.query(`SELECT * FROM classroom WHERE cr_eng = '${building_eng}' ORDER BY cr_classroom ASC;`, function(err2, classrooms) {
				if (err2) { throw err2; }
				db.query(`SELECT t.* FROM teach AS t JOIN lesson AS le ON t.t_teacher = le.l_teacher WHERE le.l_building = '${building_ko}';`, function(err3, teachs) {
					if (err3) { throw err3; }
					db.query(`SELECT * FROM lesson WHERE l_building = '${building_ko}';`, function(err4, lessons) {
						if (err4) { throw err4; }
						db.query(`SELECT le.* FROM lesson AS le JOIN classroom AS cr ON le.l_building = cr.cr_building WHERE cr.cr_eng = '${building_eng}' GROUP BY le.l_id;`, function(error, times) {
							if (error) { throw error; }
							res.render(`time/${building_eng}`, { weeks: weeks,  classrooms: classrooms, teachs: teachs, lessons: lessons, times: times });
						});
					});
				});
			});
		});
	});
});

/*  3. 강의실 관리 - 수정 */
app.post('/classroom_update_process', function(req, res){
	var building_eng = req.body.building_eng;
	var building_ko = req.body.building_ko;
	var classroomBefore = req.body.classroomBefore;
	var classroomAfter = req.body.classroomAfter;

	//console.log(building_eng);
	//console.log(building_ko);
	//console.log(classroomBefore);
	//console.log(classroomAfter);
	
	
	const sql = 'UPDATE classroom SET cr_classroom = ? WHERE cr_building = ? AND cr_classroom = ?';
	db.query(sql, [classroomAfter, building_ko, classroomBefore], function(err, result){
		if (err) {
			console.error('강의실 수정 실패: ' + err.message);
			res.status(500).send('강의실 수정 실패');
			return;
		}
	  
		console.log('강의실 수정 성공');

		db.query(`SELECT * FROM week;`, function(err1, weeks) {
			if (err1) { throw err1; }
			db.query(`SELECT * FROM classroom WHERE cr_eng = '${building_eng}' ORDER BY cr_classroom ASC;`, function(err2, classrooms) {
				if (err2) { throw err2; }
				db.query(`SELECT t.* FROM teach AS t JOIN lesson AS le ON t.t_teacher = le.l_teacher WHERE le.l_building = '${building_ko}';`, function(err3, teachs) {
					if (err3) { throw err3; }
					db.query(`SELECT * FROM lesson WHERE l_building = '${building_ko}';`, function(err4, lessons) {
						if (err4) { throw err4; }
						db.query(`SELECT le.* FROM lesson AS le JOIN classroom AS cr ON le.l_building = cr.cr_building WHERE cr.cr_eng = '${building_eng}' GROUP BY le.l_id;`, function(error, times) {
							if (error) { throw error; }
							res.render(`time/${building_eng}`, { weeks: weeks,  classrooms: classrooms, teachs: teachs, lessons: lessons, times: times });
						});
					});
				});
			});
		});
	});
});
/*  3. 강의실 관리 - 삭제 */
/*  4. 강사 관리 - 추가 */
/*  4. 강사 관리 - 수정 */
/*  4. 강사 관리 - 삭제 */
/*  5. 수업 추가  */
/*  6. 상세 보기 - 수정 */
/*  6. 상세 보기 - 삭제 */























/*
app.get('/', function(req, res){
	db.query(`SELECT cr_eng, cr_building FROM classroom GROUP BY cr_building, cr_eng ORDER BY cr_building ASC;`, function(err, buildings){
		var title = 'TTT시간표';
		var building = template.list(buildings, 'null');
		var html = template.HTML(
			`${title}`, 
			`${building}`, 
			`<div><p>건물을 선택해주세요.</p></div>`, 
			template.cate()
		);
		res.send(html);
	});
});

app.get('/yd1', function(req, res){
	var title = '역동관(1관)';
	var cr_eng = 'yd1';
	db.query(`SELECT cr_eng, cr_building FROM classroom GROUP BY cr_building, cr_eng ORDER BY cr_building ASC;`, function(err1, buildings){
		if (err1) throw err1;
		var building = template.list(buildings, cr_eng);
		db.query(`SELECT * FROM week;`, function(err2, weeks){
			if (err2) throw err2;
			db.query(`SELECT * FROM classroom WHERE cr_eng = '${cr_eng}' ORDER BY cr_classroom ASC;`, function(err3, classrooms){
				if (err3) throw err3;
				db.query(`SELECT le.* FROM lesson as le JOIN classroom as cr ON le.l_building = cr.cr_building WHERE cr.cr_eng = '${cr_eng}' GROUP BY le.l_id;`, function(err4, lessons){
					if (err4) throw err4;
					db.query(`SELECT * FROM teach;`, function(err5, teachs){
						if (err5) throw err5;
						var table = template.tableex(weeks, classrooms, lessons, teachs);
						var html = template.HTML(
							`${title}`, 
							`${building}`, 
							`${table}`, 
							template.cate()
						);
						res.send(html);
					});
				});
			});
		});
	});
});

app.get('/yd3', function(req, res){
	var title = '역동관(3관)';
	var cr_eng = 'yd3';
	db.query(`SELECT cr_eng, cr_building FROM classroom GROUP BY cr_building, cr_eng ORDER BY cr_building ASC;`, function(err1, buildings){
		if (err1) throw err1;
		var building = template.list(buildings, cr_eng);
		db.query(`SELECT * FROM week;`, function(err2, weeks){
			if (err2) throw err2;
			db.query(`SELECT * FROM classroom WHERE cr_eng = '${cr_eng}' ORDER BY cr_classroom ASC;`, function(err3, classrooms){
				if (err3) throw err3;
				db.query(`SELECT le.* FROM lesson as le JOIN classroom as cr ON le.l_building = cr.cr_building WHERE cr.cr_eng = '${cr_eng}' GROUP BY le.l_id;`, function(err4, lessons){
					if (err4) throw err4;
					db.query(`SELECT * FROM teach;`, function(err5, teachs){
						if (err5) throw err5;
						var table = template.tableex(weeks, classrooms, lessons, teachs);
						var html = template.HTML(
							`${title}`, 
							`${building}`, 
							`${table}`, 
							template.cate()
						);
						res.send(html);
					});
				});
			});
		});
	});
});

app.get('/ydm', function(req, res){
	var title = '역동관(본관)';
	var cr_eng = 'ydm';
	db.query(`SELECT cr_eng, cr_building FROM classroom GROUP BY cr_building, cr_eng ORDER BY cr_building ASC;`, function(err1, buildings){
		if (err1) throw err1;
		var building = template.list(buildings, cr_eng);
		db.query(`SELECT * FROM week;`, function(err2, weeks){
			if (err2) throw err2;
			db.query(`SELECT * FROM classroom WHERE cr_eng = '${cr_eng}' ORDER BY cr_classroom ASC;`, function(err3, classrooms){
				if (err3) throw err3;
				db.query(`SELECT le.* FROM lesson as le JOIN classroom as cr ON le.l_building = cr.cr_building WHERE cr.cr_eng = '${cr_eng}' GROUP BY le.l_id;`, function(err4, lessons){
					if (err4) throw err4;
					db.query(`SELECT * FROM teach;`, function(err5, teachs){
						if (err5) throw err5;
						var table = template.tableex(weeks, classrooms, lessons, teachs);
						var html = template.HTML(
							`${title}`, 
							`${building}`, 
							`${table}`, 
							template.cate()
						);
						res.send(html);
					});
				});
			});
		});
	});
});

app.get('/tj', function(req, res){
	var title = '태전관';
	var cr_eng = 'tj';
	db.query(`SELECT cr_eng, cr_building FROM classroom GROUP BY cr_building, cr_eng ORDER BY cr_building ASC;`, function(err1, buildings){
		if (err1) throw err1;
		var building = template.list(buildings, cr_eng);
		db.query(`SELECT * FROM week;`, function(err2, weeks){
			if (err2) throw err2;
			db.query(`SELECT * FROM classroom WHERE cr_eng = '${cr_eng}' ORDER BY cr_classroom ASC;`, function(err3, classrooms){
				if (err3) throw err3;
				db.query(`SELECT le.* FROM lesson as le JOIN classroom as cr ON le.l_building = cr.cr_building WHERE cr.cr_eng = '${cr_eng}' GROUP BY le.l_id;`, function(err4, lessons){
					if (err4) throw err4;
					db.query(`SELECT * FROM teach;`, function(err5, teachs){
						if (err5) throw err5;
						var table = template.tableex(weeks, classrooms, lessons, teachs);
						var html = template.HTML(
							`${title}`, 
							`${building}`, 
							`${table}`, 
							template.cate()
						);
						res.send(html);
					});
				});
			});
		});
	});
});

function search_pro() {
    var searchTerm = document.getElementById('searchInput').value;
    console.log('검색어:', searchTerm);
}

app.post('/search_process', function(req, res){
    var searchTerm = req.body.searchTerm;
    db.query(`SELECT * FROM lesson WHERE CONCAT_WS(" ", l_teacher, l_grade, l_subject) LIKE '%${searchTerm}%'`, function(err, searchResults){
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.send(searchResults);
    });
});
*/

// 404 오류
app.use((req, res, next) => {
    res.status(404).send('Not Found');
});

// 포트 8080
app.listen(port, function (err){
	if (err) return console.log(err);
	console.log("The server is listening on port 8080");
});

const express = require('express');
const fs = require('fs');
const csv = require('csv-parser'); // csv-parser 모듈 추가
// const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');



const app = express();
const port = 5502;



let userCount = 0;
let bookCount = 0;
const userCsvFilePath = 'users.csv';
const bookCsvFilePath = 'book.csv';

fs.access(userCsvFilePath, fs.constants.F_OK, (err) => {
    if (err) {
        // 파일이 존재하지 않는 경우 파일을 생성
        const columns = 'ID,Username,Email,Password\n'; // 열 이름 추가
        fs.writeFile(userCsvFilePath, columns, (writeErr) => {
            if (writeErr) throw writeErr;
            console.log('users.csv 파일이 생성되었습니다.');
        });
        userCount = 0; // 초기 사용자 수 설정
    } else {
        // 파일이 존재하는 경우 마지막 사용자 ID를 읽어옴
        fs.readFile(userCsvFilePath, 'utf-8', (readErr, data) => {
            if (!readErr) {
                const lines = data.trim().split('\n');
                if (lines.length > 0) {
                    const lastLine = lines[lines.length - 1];
                    const lastUserID = lastLine.split(',')[0];
                    userCount = parseInt(lastUserID) || 0;
                }
            }
        });
    }
});

fs.access(bookCsvFilePath, fs.constants.F_OK, (err) => {
    if (err) {
        fs.writeFile(bookCsvFilePath, 'ID,분류,책이미지,제목,저자,출판사,발행일,독서기록,평점\n', (writeErr) => {
            if (writeErr) throw writeErr;
            console.log('book.csv 파일이 생성되었습니다.');
        });
        bookCount = 0;
    } else {
        fs.readFile(bookCsvFilePath, 'utf-8', (readErr, data) => {
            if (!readErr) {
                const lines = data.trim().split('\n');
                if (lines.length > 0) {
                    const lastLine = lines[lines.length - 1];
                    const lastBookID = lastLine.split(',')[0];
                    bookCount = parseInt(lastBookID) || 0;
                }
            }
        });
    }
});



app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(bodyParser.json());

// get 함수
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/home.html');
});

app.get('/book', (req, res) => {
    res.sendFile(__dirname + '/public/book.html');
});

app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/public/register.html');
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

app.get('/get-server-url', (req, res) => {
    const serverURL = `http://localhost:${port}`;
    res.send(serverURL);
});





// post 함수 
app.post('/register', (req, res) => {
    const { username, email, password } = req.body;

    // CSV 파일에서 이메일 중복 확인
    fs.readFile(__dirname + '/users.csv', 'utf-8', (err, data) => {
        if (!err) {
            const lines = data.trim().split('\n');
            for (const line of lines) {
                const userData = line.split(',');
                if (userData[2] === email) {
                    res.json({ success: false, comment: "이미 등록된 이메일입니다" }); // 회원가입 실패 응답
                    return;
                }
            }
            
            // 중복되는 이메일이 없으면 회원가입 진행
            const id = ++userCount; // ID를 현재 사용자 수에 1을 더해 자동으로 생성
            const userData = `${id},${username},${email},${password}\n`;
            fs.appendFile(__dirname + '/users.csv', userData, { encoding: 'utf-8' }, (err) => {
                if (err) throw err;
                res.json({ success: true, comment: "회원가입 성공!" }); // 회원가입 실패 응답
            });
        } else {
            console.log(err);
            res.json({ success: true, comment: "회원가입 오류?!" }); // 회원가입 실패 응답
        }
    });
});


app.post('/book', (req, res) => {
    const { 분류, 책이미지, 제목, 저자, 출판사, 발행일, 독서기록, 평점 } = req.body;
    const id = ++bookCount;
    const bookData = `${id},${분류},${책이미지},${제목},${저자},${출판사},${발행일},${독서기록},${평점}\n`;
    console.log(bookData);

    fs.appendFile(bookCsvFilePath, bookData, { encoding: 'utf-8' }, (err) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error writing to file');
            return;
        }
        console.log(bookData);
        // res.sendFile(__dirname + '/public/html/book.html');
    });
});


app.post('/login', (req, res) => {
    const { username, password } = req.body;
    let userFound = false; // 사용자가 발견되었는지 여부를 추적

    // CSV 파일 읽기 및 사용자 확인
    fs.createReadStream(userCsvFilePath)
        .pipe(csv())
        .on('data', (data) => {
            if (data.Username === username && data.Password === password) {
                // 사용자가 발견되었고 비밀번호가 일치하면 userFound를 true로 설정
                userFound = true;
            }
        })
        .on('end', () => {
            // 데이터 처리가 완료된 후에 사용자가 발견되었는지 확인
            if (userFound) {
                // 로그인 성공 시 book 페이지로 리다이렉트
                res.redirect('/book');
            } else {
                // 사용자가 발견되지 않으면 해당하는 메시지를 보내기
                res.send('사용자 정보가 일치하지 않습니다.');
            }
        });
});







app.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});

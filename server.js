const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// 数据库
const db = new sqlite3.Database('./rental.db', (err) => {
  if (err) console.error(err.message);
  else console.log('数据库连接成功');
});

// 建表
db.run(`CREATE TABLE IF NOT EXISTS bookings (
  bid INTEGER PRIMARY KEY AUTOINCREMENT,
  uid TEXT,
  carId INTEGER,
  carName TEXT,
  name TEXT,
  contact TEXT,
  time TEXT,
  remark TEXT,
  createAt TEXT,
  status TEXT DEFAULT '待确认',
  isRead INTEGER DEFAULT 0
)`);

db.run(`CREATE TABLE IF NOT EXISTS chatMsg (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT,
  content TEXT,
  time INTEGER
)`);

db.run(`CREATE TABLE IF NOT EXISTS users (
  uid TEXT PRIMARY KEY,
  username TEXT UNIQUE,
  pwd TEXT,
  nickname TEXT
)`);

// ========== 预约接口 ==========
// 新增预约
app.post('/api/book', (req, res) => {
  const {uid,carId,carName,name,contact,time,remark,createAt} = req.body;
  db.run(`INSERT INTO bookings (uid,carId,carName,name,contact,time,remark,createAt,status,isRead)
  VALUES (?,?,?,?,?,?,?,?,?,0)`,
    [uid,carId,carName,name,contact,time,remark,createAt],
    function(err){
      if(err) return res.json({ok:false,msg:err.message});
      res.json({ok:true,bid:this.lastID});
    })
});

// 获取全部预约（管理员）
app.get('/api/book/all', (req, res) => {
  db.all(`SELECT * FROM bookings ORDER BY bid DESC`, (err,rows)=>{
    if(err) return res.json({ok:false});
    res.json({ok:true,list:rows});
  })
});

// 修改订单状态 / 标记已读
app.post('/api/book/update', (req,res)=>{
  const {bid,status,isRead} = req.body;
  let sql,params;
  if(isRead !== undefined){
    sql = `UPDATE bookings SET isRead=? WHERE bid=?`;
    params = [isRead,bid];
  }else{
    sql = `UPDATE bookings SET status=? WHERE bid=?`;
    params = [status,bid];
  }
  db.run(sql,params,err=>{
    if(err) return res.json({ok:false});
    res.json({ok:true});
  })
});

// 获取我的预约（用户）
app.get('/api/book/my/:uid', (req,res)=>{
  const uid = req.params.uid;
  db.all(`SELECT * FROM bookings WHERE uid=? ORDER BY bid DESC`,[uid],(err,rows)=>{
    if(err) return res.json({ok:false});
    res.json({ok:true,list:rows});
  })
});

// ========== 用户接口 ==========
app.post('/api/user/register',(req,res)=>{
  const {uid,username,pwd,nickname} = req.body;
  db.run(`INSERT INTO users (uid,username,pwd,nickname) VALUES (?,?,?,?)`,
    [uid,username,pwd,nickname],err=>{
      if(err) return res.json({ok:false,msg:"账号已存在"});
      res.json({ok:true});
    })
})

app.post('/api/user/login',(req,res)=>{
  const {username,pwd} = req.body;
  db.get(`SELECT * FROM users WHERE username=? AND pwd=?`,[username,pwd],(err,row)=>{
    if(err || !row) return res.json({ok:false,msg:"账号密码错误"});
    res.json({ok:true,user:row});
  })
})

app.post('/api/user/save',(req,res)=>{
  const {uid,nickname} = req.body;
  db.run(`UPDATE users SET nickname=? WHERE uid=?`,[nickname,uid],err=>{
    if(err) return res.json({ok:false});
    res.json({ok:true});
  })
})

// ========== 聊天接口 ==========
app.post('/api/chat/add',(req,res)=>{
  const {type,content,time} = req.body;
  db.run(`INSERT INTO chatMsg (type,content,time) VALUES (?,?,?)`,[type,content,time],err=>{
    if(err) return res.json({ok:false});
    res.json({ok:true});
  })
})
app.get('/api/chat/list',(req,res)=>{
  db.all(`SELECT * FROM chatMsg ORDER BY id ASC`,(err,rows)=>{
    if(err) return res.json({ok:false});
    res.json({ok:true,list:rows});
  })
})

// 启动
app.listen(port, () => {
  console.log(`后端服务运行在 http://localhost:${port}`);
});
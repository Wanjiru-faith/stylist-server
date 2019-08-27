"use strict";
const sqlite3 = require('sqlite3').verbose();

  
//We created a class for our database to abstract the basic functions we need
class Db {
    constructor(file) {
        this.db = new sqlite3.Database(file, (err) => {
            if (err) {
              return console.error(err.message);
            }
            console.log('Connected to the in-memory SQlite database.');
          });
        this.createTable()
    }

    createTable() {
        const sql = `
        CREATE TABLE IF NOT EXISTS user (
            id integer PRIMARY KEY,
            firstName text,
            secondName text, 
            email text UNIQUE, 
            user_pass text, 
            is_stylist integer);

        CREATE TABLE IF NOT EXISTS stylist_profile (
            id integer PRIMARY KEY,
            image text, 
            name text UNIQUE, 
            workplace text, 
            description text,
            services text,
            submitted boolean);
                    `
        return this.db.run(sql);
    }


    selectByEmail(email, callback) {
        let sql = `SELECT * FROM user WHERE email = ?`;
        console.log(sql);
        return this.db.get(sql, [email], (err, row) => {
            callback(err,row)
        });
    }
    insertStylist(user, callback) {
        return this.db.run(
            'INSERT INTO user (firstName,secondName,email,user_pass,is_stylist) VALUES (?,?,?,?,?)',
            user, (err) => {
                callback(err)
            }) 
    }
    selectAll(callback) {
        return this.db.all(`SELECT * FROM user`, function(err,rows){ 
            callback(err,rows)
        })   
    }
    insert(user, callback) {
        return this.db.run(
            'INSERT INTO user (firstName,secondName,email,user_pass,is_stylist) VALUES (?,?,?,?,?)',
            user, (err) => {
                callback(err)    
            }) 
    } 
    insertStylistProfile(stylist_profile, callback) {     
        return this.db.run(
            'INSERT INTO stylist_profile (image,name,workplace,description,services,submitted) VALUES (?,?,?,?,?,?)',
            stylist_profile, (err) => { 
                callback(err)
            }) 
    }  
    selectById(id, callback) {
        let sql = `SELECT * FROM stylist_profile WHERE id = ?`; 
        console.log(sql, id);
        return this.db.get(sql, [id], (err, row) => {
            callback(err,row)
        });
    }
}
module.exports = Db